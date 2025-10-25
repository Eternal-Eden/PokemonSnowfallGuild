'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ForumActivity, ActivityParticipant } from '@/types/forum';
import { Calendar, Users, Gift, MapPin, Clock, AlertCircle, X, Star, Trophy, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityDetailModalProps {
  activity: ForumActivity | null;
  isOpen: boolean;
  onClose: () => void;
  onRegister?: (activityId: string) => void;
  isRegistering?: boolean;
  currentUserId?: string;
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  activity,
  isOpen,
  onClose,
  onRegister,
  isRegistering = false,
  currentUserId
}) => {
  if (!activity) return null;

  const isRegistrationClosed = new Date() > new Date(activity.registrationDeadline);
  const isFull = activity.maxParticipants ? activity.currentParticipants >= activity.maxParticipants : false;
  const isUserRegistered = activity.participants?.some(p => p.userId === currentUserId);

  const getMembershipBadge = (participant: ActivityParticipant) => {
    const isExpired = participant.isExpired || 
      (participant.membershipExpiry && new Date() > new Date(participant.membershipExpiry));
    
    let badgeText = '';
    let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
    
    switch (participant.membershipType) {
      case 'yearly':
        badgeText = '年费';
        badgeVariant = isExpired ? 'destructive' : 'default';
        break;
      case 'monthly':
        badgeText = '月费';
        badgeVariant = isExpired ? 'destructive' : 'secondary';
        break;
      case 'free':
      default:
        badgeText = '免费';
        badgeVariant = 'outline';
        break;
    }
    
    return (
      <Badge 
        variant={badgeVariant} 
        className={isExpired ? 'text-red-600 border-red-600' : ''}
      >
        {badgeText}
      </Badge>
    );
  };

  const getRegisterButtonText = () => {
    if (!currentUserId) return '请先登录';
    if (isUserRegistered) return '已报名';
    if (isRegistrationClosed) return '报名已截止';
    if (isFull) return '报名已满';
    return '立即报名';
  };

  const canRegister = currentUserId && !isUserRegistered && !isRegistrationClosed && !isFull;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 border-0 shadow-2xl">
            {/* 装饰性背景 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute top-10 right-10 w-24 h-24 bg-purple-200/20 dark:bg-purple-500/10 rounded-full blur-2xl"
                animate={{
                  x: [0, -20, 0],
                  y: [0, 15, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute bottom-10 left-10 w-32 h-32 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-2xl"
                animate={{
                  x: [0, 25, 0],
                  y: [0, -20, 0],
                  scale: [1, 0.9, 1]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
            </div>

            <DialogHeader className="relative z-10 pb-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start justify-between"
              >
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-2">
                    {activity.title}
                  </DialogTitle>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                      <Sparkles className="w-4 h-4" />
                      <span className="font-medium">活动进行中</span>
                    </div>
                    <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                      <Users className="w-4 h-4" />
                      <span>{activity.currentParticipants} 人参与</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </DialogHeader>
            
            <ScrollArea className="max-h-[calc(95vh-180px)] relative z-10">
              <div className="space-y-8 p-1">
            {/* 活动配图 */}
            {activity.imageUrls && activity.imageUrls.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"></div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">活动配图</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {activity.imageUrls.map((imageUrl, index) => (
                    <motion.div 
                      key={index} 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300 group"
                    >
                      <Image
                        src={imageUrl}
                        alt={`活动配图 ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300 cursor-pointer"
                        onClick={() => window.open(imageUrl, '_blank')}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute bottom-2 right-2 w-6 h-6 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Star className="w-3 h-3 text-yellow-500" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            
            {/* 活动信息 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">活动描述</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">{activity.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">开始时间</div>
                    <div className="text-gray-900 dark:text-white font-semibold">
                      {format(new Date(activity.startTime), 'MM月dd日 HH:mm', { locale: zhCN })}
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200/50 dark:border-red-700/50"
                >
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-red-600 dark:text-red-400 font-medium">结束时间</div>
                    <div className="text-gray-900 dark:text-white font-semibold">
                      {format(new Date(activity.endTime), 'MM月dd日 HH:mm', { locale: zhCN })}
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200/50 dark:border-orange-700/50"
                >
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">报名截止</div>
                    <div className="text-gray-900 dark:text-white font-semibold">
                      {format(new Date(activity.registrationDeadline), 'MM月dd日 HH:mm', { locale: zhCN })}
                    </div>
                  </div>
                </motion.div>
                
                {activity.location && (
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200/50 dark:border-green-700/50"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium">活动地点</div>
                      <div className="text-gray-900 dark:text-white font-semibold">{activity.location}</div>
                    </div>
                  </motion.div>
                )}
                
                <motion.div 
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200/50 dark:border-purple-700/50"
                >
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">参与人数</div>
                    <div className="text-gray-900 dark:text-white font-semibold">
                      {activity.currentParticipants}{activity.maxParticipants && `/${activity.maxParticipants}`} 人
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* 活动奖励 */}
              {activity.rewards && activity.rewards.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-yellow-200/50 dark:border-yellow-700/50 relative overflow-hidden"
                >
                  {/* 装饰性背景 */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 dark:from-yellow-500/10 dark:to-orange-500/10 rounded-full blur-xl"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-6">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg"
                      >
                        <Trophy className="h-6 w-6 text-white" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">活动奖励</h3>
                    </div>
                    <div className="grid gap-3">
                      {activity.rewards.map((reward, index) => (
                        <motion.div 
                          key={index} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                          className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-yellow-200/50 dark:border-yellow-700/50 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center">
                              <Gift className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white">{reward.name}</span>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{reward.description}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* 活动要求 */}
              {activity.requirements && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50 relative overflow-hidden"
                >
                  {/* 装饰性背景 */}
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/30 to-purple-200/30 dark:from-blue-500/10 dark:to-purple-500/10 rounded-full blur-xl"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <AlertCircle className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">活动要求</h3>
                    </div>
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {activity.requirements}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
            
            {/* 参与者列表 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/50 relative overflow-hidden"
            >
              {/* 装饰性背景 */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-green-200/20 to-emerald-200/20 dark:from-green-500/10 dark:to-emerald-500/10 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <Users className="h-6 w-6 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    已报名成员 ({activity.participants?.length || 0}人)
                  </h3>
                </div>
                
                {activity.participants && activity.participants.length > 0 ? (
                  <div className="grid gap-4">
                    {activity.participants.map((participant, index) => (
                      <motion.div 
                        key={participant.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 5 }}
                        className={`flex items-center justify-between p-4 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 ${
                          participant.isExpired 
                            ? 'bg-red-50/70 border-red-200/50 dark:bg-red-900/20 dark:border-red-700/50' 
                            : 'bg-white/70 dark:bg-gray-800/70 border-green-200/50 dark:border-green-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                              <AvatarImage src={participant.userAvatar} />
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                                {participant.userName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div>
                            <span className={`font-semibold ${
                              participant.isExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                            }`}>
                              {participant.userName}
                            </span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {format(new Date(participant.registeredAt), 'MM月dd日 HH:mm', { locale: zhCN })} 报名
                              </span>
                            </div>
                          </div>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center space-x-2"
                        >
                          {getMembershipBadge(participant)}
                          {participant.isExpired && (
                            <Badge variant="destructive" className="text-xs shadow-sm">
                              逾期
                            </Badge>
                          )}
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">暂无参与者</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">成为第一个报名的人吧！</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </ScrollArea>
        
        {/* 底部操作按钮 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-between items-center pt-6 border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/80 via-white/80 to-gray-50/80 dark:from-gray-800/80 dark:via-gray-900/80 dark:to-gray-800/80 backdrop-blur-sm relative z-10"
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="px-6 py-2.5 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white/80 dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              关闭
            </Button>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className="relative"
          >
            <Button
              onClick={() => canRegister && onRegister?.(activity.id)}
              disabled={!canRegister || isRegistering}
              variant={isUserRegistered ? 'secondary' : 'default'}
              className={`px-8 py-2.5 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-0 relative overflow-hidden group ${
                isUserRegistered 
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white' 
                  : canRegister 
                    ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white'
                    : 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-200 cursor-not-allowed'
              }`}
            >
              {/* 按钮光效 */}
              {canRegister && !isUserRegistered && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              )}
              
              <div className="relative z-10 flex items-center space-x-2">
                {isRegistering ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    <span>报名中...</span>
                  </>
                ) : (
                  <>
                    {canRegister && !isUserRegistered && <Sparkles className="w-4 h-4" />}
                    <span>{getRegisterButtonText()}</span>
                  </>
                )}
              </div>
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ActivityDetailModal;