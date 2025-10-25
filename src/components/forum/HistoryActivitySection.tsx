'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ForumActivity } from '@/types/forum';
import { Calendar, Users, Gift, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ActivityDetailModal from './ActivityDetailModal';
import { getHistoryForumActivities } from '@/lib/forumService';
import { useAuth } from '@/hooks/useAuth';

const HistoryActivitySection: React.FC = () => {
  const [activities, setActivities] = useState<ForumActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ForumActivity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadHistoryActivities();
  }, []);

  const loadHistoryActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHistoryForumActivities();
      setActivities(data);
    } catch (err) {
      console.error('加载历史活动失败:', err);
      setError('加载历史活动失败');
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = (activity: ForumActivity) => {
    setSelectedActivity(activity);
    setIsModalOpen(true);
  };

  const displayedActivities = isExpanded ? activities : activities.slice(0, 3);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            历史活动
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            历史活动
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-500 text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadHistoryActivities}
              className="mt-2"
            >
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            历史活动
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">暂无历史活动</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleActivityClick(activity)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm line-clamp-1">{activity.title}</h4>
                    <Badge variant="secondary" className="text-xs ml-2">
                      已结束
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {activity.description}
                  </p>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {format(new Date(activity.startTime), 'MM月dd日', { locale: zhCN })}
                        {' - '}
                        {format(new Date(activity.endTime), 'MM月dd日', { locale: zhCN })}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users className="h-3 w-3" />
                        <span>{activity.currentParticipants}人参与</span>
                      </div>
                      
                      {activity.rewards && activity.rewards.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-yellow-600">
                          <Gift className="h-3 w-3" />
                          <span>{activity.rewards.length}个奖励</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {activities.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full mt-2"
                >
                  {isExpanded ? (
                    <>
                      收起 <ChevronUp className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      查看更多 ({activities.length - 3}个) <ChevronDown className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedActivity(null);
        }}
        currentUserId={user?.id}
      />
    </>
  );
};

export default HistoryActivitySection;