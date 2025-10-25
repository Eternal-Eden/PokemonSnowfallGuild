'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '@/types/auth';
import { AuthUser, getAllUsers } from '@/lib/auth-client';
import { searchUsers } from '@/lib/userProfile';
import UserAvatar from '@/components/UserAvatar';
import RoleBadge from '@/components/RoleBadge';
import { Search, Users, UserPlus } from 'lucide-react';

interface UserSearchProps {
  currentUser?: User | null;
  onUserSelect?: (user: AuthUser) => void;
}

interface SearchResult {
  id: string;
  gameNickname: string;
  uniqueId: string;
  avatarUrl?: string;
  role: string;
}

export default function UserSearch({ currentUser, onUserSelect }: UserSearchProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<AuthUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AuthUser[]>([]);

  useEffect(() => {
    loadAllUsers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = allUsers.filter(user => {
        const query = searchTerm.toLowerCase();
        return (
          user.gameNickname?.toLowerCase().includes(query) ||
          user.uniqueId?.toLowerCase().includes(query) ||
          user.username?.toLowerCase().includes(query)
        );
      });
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [searchTerm, allUsers]);

  const loadAllUsers = async () => {
    try {
      const users = await getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('加载用户列表失败:', error);
    }
  };



  const handleUserClick = (user: AuthUser) => {
    if (onUserSelect) {
      onUserSelect(user);
    } else {
      router.push(`/profile/${user.id}`);
    }
    setIsOpen(false);
    setSearchTerm('');
    setFilteredUsers([]);
  };



  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-start px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-left"
      >
        <Search className="mr-2 h-4 w-4" />
        搜索用户...
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">搜索用户</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="输入用户名或昵称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="flex items-center space-x-3">
                      <UserAvatar user={user} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.gameNickname || user.username}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          @{user.username} • ID: {user.uniqueId}
                        </p>
                      </div>
                      <RoleBadge role={user.role as UserRole} />
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && searchTerm && (
                  <div className="text-center py-4 text-gray-500">
                    未找到匹配的用户
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}