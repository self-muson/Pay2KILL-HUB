import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import {
  registerUserAsync,
  loginUserAsync,
  getUserByToken,
  getUserByTokenAsync,
  getAllUsers,
  getAllUsersAsync,
  updateUserRoleAsync,
  updateUserPermissionsAsync,
  updateUserCharactersAsync,
  updateUserProfileAsync,
  deleteUserAsync,
} from '@/lib/user-store';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  const user = await getUserByTokenAsync(token);
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  return NextResponse.json({ success: true, user });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'register') {
      const { username, password, displayName, clanName, discordTag, inviteCode } = body;
      const result = await registerUserAsync({
        username,
        password,
        displayName,
        clanName,
        discordTag,
        inviteCode,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json(result);
    }

    if (action === 'login') {
      const { username, password } = body;
      const result = await loginUserAsync(username, password);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json(result);
    }

    if (action === 'get_profile') {
      const { token } = body;
      const user = await getUserByTokenAsync(token);
      if (!user) {
        return NextResponse.json({ error: 'Сессия не найдена или истекла' }, { status: 401 });
      }
      return NextResponse.json({ success: true, user });
    }

    if (action === 'save_characters') {
      const { token, characters, activeCharacterId } = body;
      const user = await getUserByTokenAsync(token);
      if (!user) {
        return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
      }

      const result = await updateUserCharactersAsync(user.id, characters, activeCharacterId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      const updated = await getUserByTokenAsync(token);
      return NextResponse.json({ success: true, user: updated });
    }

    if (action === 'update_profile') {
      const { token, displayName, clanName, discordTag } = body;
      const user = await getUserByTokenAsync(token);
      if (!user) {
        return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
      }

      const result = await updateUserProfileAsync(user.id, { displayName, clanName, discordTag });
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      const updated = await getUserByTokenAsync(token);
      return NextResponse.json({ success: true, user: updated });
    }

    if (action === 'get_all_users') {
      const { token } = body;
      const user = await getUserByTokenAsync(token);
      if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Доступ только для Лидера Клана (Администратора)' }, { status: 403 });
      }

      const users = await getAllUsersAsync();
      return NextResponse.json({ success: true, users });
    }

    if (action === 'update_user_role') {
      const { token, targetUserId, newRole } = body;
      const user = await getUserByTokenAsync(token);
      if (!user || (user.role !== 'admin' && !user.permissions?.canManageUsers)) {
        return NextResponse.json({ error: 'Доступ только для Лидера Клана (Администратора)' }, { status: 403 });
      }

      const result = await updateUserRoleAsync(user.id, targetUserId, newRole);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      const users = await getAllUsersAsync();
      return NextResponse.json({ success: true, users });
    }

    if (action === 'update_user_permissions') {
      const { token, targetUserId, permissions } = body;
      const user = await getUserByTokenAsync(token);
      if (!user || (user.role !== 'admin' && !user.permissions?.canManageUsers)) {
        return NextResponse.json({ error: 'Доступ только для Лидера Клана (Администратора)' }, { status: 403 });
      }

      const result = await updateUserPermissionsAsync(user.id, targetUserId, permissions);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      const users = await getAllUsersAsync();
      return NextResponse.json({ success: true, users, updatedUser: result.updatedUser });
    }

    if (action === 'delete_user') {
      const { token, targetUserId } = body;
      const user = await getUserByTokenAsync(token);
      if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: 'Доступ только для Лидера Клана (Администратора)' }, { status: 403 });
      }

      const result = await deleteUserAsync(user.id, targetUserId);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      const users = await getAllUsersAsync();
      return NextResponse.json({ success: true, users });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('API Auth Error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера авторизации' }, { status: 500 });
  }
}
