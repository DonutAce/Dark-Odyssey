import { auth, rtdb } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  get,
  ref,
  set,
  update
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

export const DEFAULT_USER_PROFILE = {
  level: 1,
  availablePoints: 0,
  introSeen: false,
  stats: {
    health: 0,
    mana: 0,
    voidCyclone: 0,
    shadowStrike: 0
  },
  stageProgress: {
    clearedStages: [],
    clearCounts: {},
    totalWins: 0
  },
  pendingAnnouncement: null
};
export const MAX_PLAYER_LEVEL = 100;
export const MAX_STAT_LEVEL = 100;
export const POINTS_PER_STAGE_WIN = 5;

const LOGIN_PATH = "./login.html";
const LOCAL_PROFILE_KEY_PREFIX = "dark_odyssey_profile_";

function cloneDefaultProfile() {
  return JSON.parse(JSON.stringify(DEFAULT_USER_PROFILE));
}

function stampNow() {
  return new Date().toISOString();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeStats(rawStats = {}) {
  return {
    health: clamp(Number(rawStats.health) || 0, 0, MAX_STAT_LEVEL),
    mana: clamp(Number(rawStats.mana) || 0, 0, MAX_STAT_LEVEL),
    voidCyclone: clamp(Number(rawStats.voidCyclone) || 0, 0, MAX_STAT_LEVEL),
    shadowStrike: clamp(Number(rawStats.shadowStrike) || 0, 0, MAX_STAT_LEVEL)
  };
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter(Boolean))];
}

function normalizeStageProgress(rawStageProgress = {}) {
  const clearedStages = uniqueStrings(rawStageProgress.clearedStages);
  const clearCounts = Object.fromEntries(
    Object.entries(rawStageProgress.clearCounts ?? {}).map(([stageId, count]) => [
      stageId,
      Math.max(0, Number(count) || 0)
    ])
  );
  const totalWins = Math.max(
    0,
    Number(rawStageProgress.totalWins) || Object.values(clearCounts).reduce((sum, count) => sum + count, 0)
  );

  return {
    clearedStages,
    clearCounts,
    totalWins
  };
}

export function normalizeProfile(rawProfile = {}, authUser = null) {
  const base = cloneDefaultProfile();
  const stageProgress = normalizeStageProgress(rawProfile.stageProgress);

  return {
    ...base,
    ...rawProfile,
    uid: rawProfile.uid || authUser?.uid || null,
    email: rawProfile.email || authUser?.email || null,
    username: rawProfile.username || authUser?.displayName || authUser?.email?.split("@")[0] || "Wanderer",
    level: clamp(Number(rawProfile.level) || 1, 1, MAX_PLAYER_LEVEL),
    availablePoints: Math.max(0, Number(rawProfile.availablePoints) || 0),
    introSeen: Boolean(rawProfile.introSeen),
    stats: normalizeStats(rawProfile.stats),
    stageProgress,
    pendingAnnouncement: rawProfile.pendingAnnouncement ?? null
  };
}

export function getWinReward(totalWins) {
  const safeWins = Math.max(0, Number(totalWins) || 0);
  return safeWins > 0 ? POINTS_PER_STAGE_WIN : 0;
}

export function getUserPower(profile) {
  const level = clamp(Number(profile?.level) || 1, 1, MAX_PLAYER_LEVEL);
  const stats = normalizeStats(profile?.stats);
  const totalStats = stats.health + stats.mana + stats.voidCyclone + stats.shadowStrike;
  const statProgress = totalStats / (MAX_STAT_LEVEL * 4);
  const levelProgress = (level - 1) / (MAX_PLAYER_LEVEL - 1 || 1);
  return clamp((statProgress * 0.65) + (levelProgress * 0.35), 0, 1);
}

export function deriveHeroStats(profile) {
  const level = clamp(Number(profile?.level) || 1, 1, MAX_PLAYER_LEVEL);
  const levelProgress = (level - 1) / (MAX_PLAYER_LEVEL - 1 || 1);
  const stats = normalizeStats(profile?.stats);
  return {
    maxLife: 120 + (level * 2) + (stats.health * 4),
    maxEnergy: 90 + level + (stats.mana * 3),
    meleeBonus: 1 + (levelProgress * 0.15) + ((stats.shadowStrike / MAX_STAT_LEVEL) * 0.45),
    skillBonus: 1 + (levelProgress * 0.18) + ((stats.voidCyclone / MAX_STAT_LEVEL) * 0.5),
    energyRegen: 16 + (levelProgress * 4) + ((stats.mana / MAX_STAT_LEVEL) * 2)
  };
}

export function deriveHeroCombat(profile) {
  const level = clamp(Number(profile?.level) || 1, 1, MAX_PLAYER_LEVEL);
  const levelProgress = (level - 1) / (MAX_PLAYER_LEVEL - 1 || 1);
  const stats = normalizeStats(profile?.stats);
  return {
    attackDamage: 18 + Math.round((stats.shadowStrike * 0.14) + (levelProgress * 6)),
    specialDamage: 34 + Math.round((stats.voidCyclone * 0.18) + (stats.shadowStrike * 0.04) + (levelProgress * 10)),
    dashDamage: 28 + Math.round(((stats.shadowStrike + stats.voidCyclone) * 0.08) + (levelProgress * 8))
  };
}

export function getEnemyScaling(profile) {
  const progress = getUserPower(profile);
  return {
    progress,
    mobMultiplier: 1 + (progress * 0.85),
    bossMultiplier: 1 + (progress * 1.15),
    mobDamageMultiplier: 1 + (progress * 0.55),
    bossDamageMultiplier: 1 + (progress * 0.8)
  };
}

function userProfileRef(uid) {
  return ref(rtdb, `users/${uid}`);
}

function localProfileKey(uid) {
  return `${LOCAL_PROFILE_KEY_PREFIX}${uid}`;
}

function readLocalProfile(uid) {
  if (!uid) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(localProfileKey(uid));
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    console.warn("Could not read local profile cache:", error);
    return null;
  }
}

function writeLocalProfile(uid, profile) {
  if (!uid || !profile) {
    return;
  }

  try {
    const normalized = normalizeProfile(profile);
    window.localStorage.setItem(localProfileKey(uid), JSON.stringify({
      uid: normalized.uid,
      email: normalized.email,
      username: normalized.username,
      level: normalized.level,
      availablePoints: normalized.availablePoints,
      introSeen: normalized.introSeen,
      stats: normalized.stats,
      stageProgress: normalized.stageProgress,
      pendingAnnouncement: normalized.pendingAnnouncement,
      updatedAt: stampNow()
    }));
  } catch (error) {
    console.warn("Could not write local profile cache:", error);
  }
}

function buildStoredProfile(profile, authUser = null, currentData = {}) {
  const normalized = normalizeProfile(profile, authUser);
  return {
    ...normalized,
    uid: normalized.uid || authUser?.uid || currentData.uid || null,
    email: normalized.email || authUser?.email || currentData.email || "",
    username: normalized.username || authUser?.displayName || currentData.username || "Wanderer",
    createdAt: currentData.createdAt || stampNow(),
    updatedAt: stampNow(),
    lastLoginAt: authUser ? stampNow() : currentData.lastLoginAt || stampNow()
  };
}

async function readDatabaseProfile(uid) {
  const snapshot = await get(userProfileRef(uid));
  return snapshot.exists() ? snapshot.val() : null;
}

async function writeDatabaseProfile(uid, profile, authUser = null, existingData = null) {
  const currentData = existingData ?? await readDatabaseProfile(uid) ?? {};
  const storedProfile = buildStoredProfile(profile, authUser, currentData);
  await set(userProfileRef(uid), storedProfile);
  writeLocalProfile(uid, storedProfile);
  return normalizeProfile(storedProfile, authUser);
}

export function waitForAuthUser(timeoutMs = 6000) {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }

    let settled = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutHandle);
      unsubscribe();
      resolve(user || null);
    });

    const timeoutHandle = window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      unsubscribe();
      resolve(auth.currentUser || null);
    }, timeoutMs);
  });
}

export async function requireAuthenticatedUser(loginPath = LOGIN_PATH) {
  const user = await waitForAuthUser();
  if (!user) {
    window.location.href = loginPath;
    throw new Error("User is not authenticated.");
  }
  return user;
}

export async function getUserProfile(uid, authUser = null) {
  const localProfile = readLocalProfile(uid);

  try {
    const databaseProfile = await readDatabaseProfile(uid);
    if (!databaseProfile) {
      const seededProfile = normalizeProfile(localProfile ?? {}, authUser);
      return await writeDatabaseProfile(uid, seededProfile, authUser, {});
    }

    const mergedProfile = normalizeProfile({
      ...(localProfile ?? {}),
      ...databaseProfile
    }, authUser);
    writeLocalProfile(uid, mergedProfile);
    return mergedProfile;
  } catch (error) {
    if (localProfile) {
      return normalizeProfile(localProfile, authUser);
    }
    throw error;
  }
}

export async function saveUserProfile(uid, patch = {}, authUser = null) {
  const baseProfile = await getUserProfile(uid, authUser);
  const mergedProfile = normalizeProfile({
    ...baseProfile,
    ...patch,
    stats: patch.stats ? { ...baseProfile.stats, ...patch.stats } : baseProfile.stats,
    stageProgress: patch.stageProgress ? {
      ...baseProfile.stageProgress,
      ...patch.stageProgress,
      clearCounts: {
        ...(baseProfile.stageProgress?.clearCounts ?? {}),
        ...(patch.stageProgress?.clearCounts ?? {})
      },
      clearedStages: patch.stageProgress?.clearedStages ?? baseProfile.stageProgress?.clearedStages
    } : baseProfile.stageProgress
  }, authUser);

  return await writeDatabaseProfile(uid, mergedProfile, authUser, baseProfile);
}

export async function awardStageCompletion(uid, stageId, authUser = null) {
  const profile = await getUserProfile(uid, authUser);
  const priorClearCount = profile.stageProgress.clearCounts?.[stageId] ?? 0;
  const nextTotalWins = (profile.stageProgress.totalWins ?? 0) + 1;
  const rewardPoints = getWinReward(nextTotalWins);

  const updatedProfile = normalizeProfile({
    ...profile,
    level: Math.min(MAX_PLAYER_LEVEL, profile.level + 1),
    availablePoints: profile.availablePoints + rewardPoints,
    stageProgress: {
      clearedStages: uniqueStrings([...(profile.stageProgress.clearedStages ?? []), stageId]),
      clearCounts: {
        ...(profile.stageProgress.clearCounts ?? {}),
        [stageId]: priorClearCount + 1
      },
      totalWins: nextTotalWins
    },
    pendingAnnouncement: {
      kind: "stage_clear",
      stageId,
      message: profile.level >= MAX_PLAYER_LEVEL
        ? `Victory claimed. Level cap reached. +${rewardPoints} stat points awarded.`
        : `Victory claimed. Level ${Math.min(MAX_PLAYER_LEVEL, profile.level + 1)} reached and +${rewardPoints} stat points awarded.`
    }
  }, authUser);

  return await writeDatabaseProfile(uid, updatedProfile, authUser, profile);
}

export async function clearLobbyAnnouncement(uid) {
  const localProfile = readLocalProfile(uid);
  if (localProfile) {
    writeLocalProfile(uid, {
      ...localProfile,
      pendingAnnouncement: null
    });
  }

  await update(userProfileRef(uid), {
    pendingAnnouncement: null,
    updatedAt: stampNow()
  });
}

