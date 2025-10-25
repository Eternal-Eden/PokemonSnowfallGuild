import { 
  User, 
  UserProfile, 
  UserStats, 
  UserPrivacySettings, 
  PokemonShowcase, 
  PokemonCard, 
  UserActivity, 
  ActivityType, 
  UserFollow 
} from '@/types/auth';

// 模拟数据存储
const userProfiles: Record<string, UserProfile> = {};
const userStats: Record<string, UserStats> = {};
const userPrivacySettings: Record<string, UserPrivacySettings> = {};
const pokemonShowcases: Record<string, PokemonShowcase> = {};
const userActivities: UserActivity[] = [];
const userFollows: UserFollow[] = [];
let activityIdCounter = 1;
let followIdCounter = 1;

// 初始化用户主页数据
export async function initializeUserProfile(userId: string, gameNickname: string): Promise<void> {
  // 初始化用户资料
  if (!userProfiles[userId]) {
    userProfiles[userId] = {
      userId: userId,
      onlineTime: 0,
      joinedAt: new Date()
    };
  }

  // 初始化用户统计
  if (!userStats[userId]) {
    userStats[userId] = {
      followersCount: 0,
      followingCount: 0,
      likesReceived: 0,
      postsCount: 0,
      repliesCount: 0,
      lastActiveAt: new Date()
    };
  }

  // 初始化隐私设置（默认全部公开）
  if (!userPrivacySettings[userId]) {
    userPrivacySettings[userId] = {
      showProfile: true,
      showStats: true,
      showOnlineTime: true,
      showPokemonShowcase: true,
      showTeamShowcase: true,
      showActivity: true,
      allowFollow: true
    };
  }

  // 初始化宝可梦展柜
  if (!pokemonShowcases[userId]) {
    pokemonShowcases[userId] = {
      id: `showcase_${userId}`,
      title: `${gameNickname}的宝可梦展柜`,
      description: '这里展示我最珍贵的宝可梦伙伴们',
      pokemons: [],
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

// 获取用户完整资料
export async function getUserProfile(userId: string, viewerId?: string): Promise<{
  success: boolean;
  profile?: UserProfile;
  stats?: UserStats;
  showcase?: PokemonShowcase;
  activities?: UserActivity[];
  canView: {
    profile: boolean;
    stats: boolean;
    showcase: boolean;
    activities: boolean;
  };
  message?: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const privacy = userPrivacySettings[userId];
  const isOwner = viewerId === userId;

  if (!privacy && !isOwner) {
    return {
      success: false,
      message: '用户不存在',
      canView: {
        profile: false,
        stats: false,
        showcase: false,
        activities: false
      }
    };
  }

  const canView = {
    profile: isOwner || (privacy?.showProfile ?? false),
    stats: isOwner || (privacy?.showStats ?? false),
    showcase: isOwner || (privacy?.showPokemonShowcase ?? false),
    activities: isOwner || (privacy?.showActivity ?? false)
  };

  const result: {
    success: boolean;
    canView: typeof canView;
    profile?: UserProfile;
    stats?: UserStats;
    showcase?: PokemonShowcase;
    activities?: UserActivity[];
  } = {
    success: true,
    canView
  };

  if (canView.profile) {
    result.profile = userProfiles[userId];
  }

  if (canView.stats) {
    result.stats = userStats[userId];
  }

  if (canView.showcase) {
    result.showcase = pokemonShowcases[userId];
  }

  if (canView.activities) {
    result.activities = userActivities
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10); // 最近10条动态
  }

  return result;
}

// 更新用户资料
export async function updateUserProfile(
  userId: string, 
  profileData: Partial<UserProfile>
): Promise<{ success: boolean; profile?: UserProfile; message?: string }> {
  await new Promise(resolve => setTimeout(resolve, 200));

  if (!userProfiles[userId]) {
    return {
      success: false,
      message: '用户不存在'
    };
  }

  userProfiles[userId] = {
    ...userProfiles[userId],
    ...profileData
  };

  // 记录动态
  await addUserActivity(userId, {
    type: ActivityType.PROFILE_UPDATED,
    title: '更新了个人资料',
    content: '用户更新了个人资料信息'
  });

  return {
    success: true,
    profile: userProfiles[userId],
    message: '资料更新成功'
  };
}

// 更新隐私设置
export async function updatePrivacySettings(
  userId: string, 
  settings: Partial<UserPrivacySettings>
): Promise<{ success: boolean; settings?: UserPrivacySettings; message?: string }> {
  await new Promise(resolve => setTimeout(resolve, 200));

  if (!userPrivacySettings[userId]) {
    return {
      success: false,
      message: '用户不存在'
    };
  }

  userPrivacySettings[userId] = {
    ...userPrivacySettings[userId],
    ...settings
  };

  return {
    success: true,
    settings: userPrivacySettings[userId],
    message: '隐私设置更新成功'
  };
}

// 获取隐私设置
export async function getPrivacySettings(userId: string): Promise<{
  success: boolean;
  settings?: UserPrivacySettings;
  message?: string;
}> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const settings = userPrivacySettings[userId];
  if (!settings) {
    return {
      success: false,
      message: '用户不存在'
    };
  }

  return {
    success: true,
    settings
  };
}

// 更新宝可梦展柜
export async function updatePokemonShowcase(
  userId: string, 
  showcaseData: Partial<PokemonShowcase>
): Promise<{ success: boolean; showcase?: PokemonShowcase; message?: string }> {
  await new Promise(resolve => setTimeout(resolve, 200));

  if (!pokemonShowcases[userId]) {
    return {
      success: false,
      message: '展柜不存在'
    };
  }

  pokemonShowcases[userId] = {
    ...pokemonShowcases[userId],
    ...showcaseData,
    updatedAt: new Date()
  };

  // 记录动态
  await addUserActivity(userId, {
    type: ActivityType.SHOWCASE_UPDATED,
    title: '更新了宝可梦展柜',
    content: `更新了展柜：${pokemonShowcases[userId].title}`
  });

  return {
    success: true,
    showcase: pokemonShowcases[userId],
    message: '展柜更新成功'
  };
}

// 添加宝可梦到展柜
export async function addPokemonToShowcase(
  userId: string, 
  pokemon: Omit<PokemonCard, 'id' | 'obtainedAt' | 'position'>
): Promise<{ success: boolean; pokemon?: PokemonCard; message?: string }> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const showcase = pokemonShowcases[userId];
  if (!showcase) {
    return {
      success: false,
      message: '展柜不存在'
    };
  }

  const newPokemon: PokemonCard = {
    ...pokemon,
    id: `pokemon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    obtainedAt: new Date(),
    position: showcase.pokemons.length
  };

  showcase.pokemons.push(newPokemon);
  showcase.updatedAt = new Date();

  // 更新用户统计
  if (userStats[userId]) {
    userStats[userId].lastActiveAt = new Date();
  }

  // 记录动态
  await addUserActivity(userId, {
    type: ActivityType.POKEMON_ADDED,
    title: `收录了新的宝可梦：${pokemon.name}`,
    content: `在展柜中添加了 ${pokemon.name}（Lv.${pokemon.level}）`
  });

  return {
    success: true,
    pokemon: newPokemon,
    message: '宝可梦添加成功'
  };
}

// 从展柜移除宝可梦
export async function removePokemonFromShowcase(
  userId: string, 
  pokemonId: string
): Promise<{ success: boolean; message?: string }> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const showcase = pokemonShowcases[userId];
  if (!showcase) {
    return {
      success: false,
      message: '展柜不存在'
    };
  }

  const pokemonIndex = showcase.pokemons.findIndex(p => p.id === pokemonId);
  if (pokemonIndex === -1) {
    return {
      success: false,
      message: '宝可梦不存在'
    };
  }

  const removedPokemon = showcase.pokemons[pokemonIndex];
  showcase.pokemons.splice(pokemonIndex, 1);
  
  // 重新排序位置
  showcase.pokemons.forEach((pokemon, index) => {
    pokemon.position = index;
  });
  
  showcase.updatedAt = new Date();

  return {
    success: true,
    message: `已移除 ${removedPokemon.name}`
  };
}

// 关注用户
export async function followUser(
  followerId: string, 
  followingId: string
): Promise<{ success: boolean; message?: string }> {
  await new Promise(resolve => setTimeout(resolve, 200));

  if (followerId === followingId) {
    return {
      success: false,
      message: '不能关注自己'
    };
  }

  // 检查是否已经关注
  const existingFollow = userFollows.find(
    f => f.followerId === followerId && f.followingId === followingId
  );

  if (existingFollow) {
    return {
      success: false,
      message: '已经关注了该用户'
    };
  }

  // 检查被关注用户的隐私设置
  const targetPrivacy = userPrivacySettings[followingId];
  if (targetPrivacy && !targetPrivacy.allowFollow) {
    return {
      success: false,
      message: '该用户不允许被关注'
    };
  }

  // 创建关注关系
  const follow: UserFollow = {
    id: `follow_${followIdCounter++}`,
    followerId,
    followingId,
    createdAt: new Date()
  };

  userFollows.push(follow);

  // 更新统计数据
  if (userStats[followerId]) {
    userStats[followerId].followingCount++;
  }
  if (userStats[followingId]) {
    userStats[followingId].followersCount++;
  }

  return {
    success: true,
    message: '关注成功'
  };
}

// 取消关注
export async function unfollowUser(
  followerId: string, 
  followingId: string
): Promise<{ success: boolean; message?: string }> {
  await new Promise(resolve => setTimeout(resolve, 200));

  const followIndex = userFollows.findIndex(
    f => f.followerId === followerId && f.followingId === followingId
  );

  if (followIndex === -1) {
    return {
      success: false,
      message: '未关注该用户'
    };
  }

  userFollows.splice(followIndex, 1);

  // 更新统计数据
  if (userStats[followerId]) {
    userStats[followerId].followingCount--;
  }
  if (userStats[followingId]) {
    userStats[followingId].followersCount--;
  }

  return {
    success: true,
    message: '取消关注成功'
  };
}

// 获取关注状态
export async function getFollowStatus(
  followerId: string, 
  followingId: string
): Promise<{ isFollowing: boolean }> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const isFollowing = userFollows.some(
    f => f.followerId === followerId && f.followingId === followingId
  );

  return { isFollowing };
}

// 获取关注列表
export async function getFollowList(
  userId: string, 
  type: 'followers' | 'following'
): Promise<{ success: boolean; users?: string[]; message?: string }> {
  await new Promise(resolve => setTimeout(resolve, 200));

  let userIds: string[];

  if (type === 'followers') {
    userIds = userFollows
      .filter(f => f.followingId === userId)
      .map(f => f.followerId);
  } else {
    userIds = userFollows
      .filter(f => f.followerId === userId)
      .map(f => f.followingId);
  }

  return {
    success: true,
    users: userIds
  };
}

// 添加用户动态
export async function addUserActivity(
  userId: string, 
  activityData: Omit<UserActivity, 'id' | 'userId' | 'createdAt'>
): Promise<{ success: boolean; activity?: UserActivity; message?: string }> {
  const activity: UserActivity = {
    id: `activity_${activityIdCounter++}`,
    userId,
    ...activityData,
    createdAt: new Date()
  };

  userActivities.push(activity);

  // 更新最后活跃时间
  if (userStats[userId]) {
    userStats[userId].lastActiveAt = new Date();
  }

  return {
    success: true,
    activity,
    message: '动态添加成功'
  };
}

// 搜索用户（通过唯一ID或昵称）
export async function searchUsers(
  query: string
): Promise<{ success: boolean; users?: { id: string; gameNickname: string; uniqueId: string }[]; message?: string }> {
  await new Promise(resolve => setTimeout(resolve, 300));

  // 这里需要从用户系统获取用户列表
  // 暂时返回模拟数据
  const mockUsers = [
    { id: 'user1', gameNickname: '小智', uniqueId: 'ASH001' },
    { id: 'user2', gameNickname: '小霞', uniqueId: 'MISTY02' },
    { id: 'user3', gameNickname: '小刚', uniqueId: 'BROCK03' }
  ];

  const filteredUsers = mockUsers.filter(user => 
    user.gameNickname.toLowerCase().includes(query.toLowerCase()) ||
    user.uniqueId.toLowerCase().includes(query.toLowerCase())
  );

  return {
    success: true,
    users: filteredUsers
  };
}

// 导出数据存储（用于其他模块访问）
export {
  userProfiles,
  userStats,
  userPrivacySettings,
  pokemonShowcases,
  userActivities,
  userFollows
};