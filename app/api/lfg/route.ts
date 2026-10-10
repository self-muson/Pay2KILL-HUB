import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { L2ClassId, Goal } from '@/lib/types';
import {
  getState,
  verifyPinCode,
  verifyBossPinCode,
  addQueuePlayer,
  removeQueuePlayer,
  refreshQueuePlayer,
  createGroup,
  takePlayerToGroup,
  returnPlayerToQueue,
  disbandGroup,
  addClan,
  deleteClan,
  addKbTopic,
  updateKbTopic,
  deleteKbTopic,
  addCharterRule,
  updateCharterRule,
  deleteCharterRule,
  resetToDemo,
  updatePinCode,
  updateAllPins,
  forceLogoutSessions,
} from '@/lib/lfg-store';

export async function GET() {
  const state = getState();
  // Strip actual PIN strings from state returned to browser for advanced security
  const safeState = {
    ...state,
    pinCode: undefined,
    adminPinCode: undefined,
    bossViewerPin: undefined,
    bossScoutPin: undefined,
    bossAdminPin: undefined,
    pinVersion: state.pinVersion || 1,
  };
  return NextResponse.json(safeState);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, requestorId, requesterSessionId, isAdmin } = body;
    const effectiveRequesterId = requestorId || requesterSessionId || 'guest_user';
    const effectiveIsAdmin = Boolean(isAdmin);

    if (action === 'verify_pin') {
      const { pin } = body;
      const res = verifyPinCode(pin?.toString().trim() || '');
      const state = getState();
      return NextResponse.json({
        ...res,
        pinVersion: state.pinVersion || 1,
      });
    }

    if (action === 'verify_boss_pin') {
      const { pin } = body;
      const res = verifyBossPinCode(pin?.toString().trim() || '');
      const state = getState();
      return NextResponse.json({
        ...res,
        pinVersion: state.pinVersion || 1,
      });
    }

    if (action === 'join_queue') {
      const { nickname, clan, role, l2Class, subClass, level, equipGrade, goal, notes, ownerId } = body;
      if (!nickname || !role || !l2Class || !goal) {
        return NextResponse.json({ error: 'Пожалуйста, заполните все обязательные поля' }, { status: 400 });
      }

      const safeLevel = Math.min(Math.max(Number(level) || 75, 1), 75);
      const safeGrade = equipGrade === 'S-Grade (S80)' ? 'A-Grade' : (equipGrade || 'A-Grade');

      const result = addQueuePlayer({
        ownerId: ownerId || effectiveRequesterId,
        nickname: nickname.trim(),
        clan: clan || 'Pay2KILL',
        role,
        l2Class,
        subClass,
        level: safeLevel,
        equipGrade: safeGrade,
        goal,
        notes,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, player: result.player, state: getState() });
    }

    if (action === 'remove_queue') {
      const { id } = body;
      const result = removeQueuePlayer(id, effectiveRequesterId, effectiveIsAdmin);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 403 });
      }
      return NextResponse.json({ success: true, state: getState() });
    }

    if (action === 'refresh_queue') {
      const { id } = body;
      const result = refreshQueuePlayer(id, effectiveRequesterId, effectiveIsAdmin);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 403 });
      }
      return NextResponse.json({ success: true, state: getState() });
    }

    if (action === 'create_group') {
      const { rlNickname, rlClan, rlClass, rlLevel, title, goal, maxMembers, discordVoice, initialMemberId, queuePlayerToLeaderId, ownerId } = body;
      if (!rlNickname) {
        return NextResponse.json({ error: 'Укажите никнейм ПЛ / РЛ' }, { status: 400 });
      }

      const safeLevel = Math.min(Math.max(Number(rlLevel) || 75, 1), 75);

      const result = createGroup(
        ownerId || effectiveRequesterId,
        rlNickname.trim(),
        rlClan || 'Pay2KILL',
        (rlClass as L2ClassId) || 'Warcryer',
        safeLevel,
        title || `Party PL ${rlNickname.trim()}`,
        (goal as Goal) || 'Raid',
        Number(maxMembers) || 9,
        discordVoice || 'Channel #PACK-1',
        initialMemberId,
        queuePlayerToLeaderId || initialMemberId
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, group: result.group, state: getState() });
    }

    if (action === 'take_player') {
      const { groupId, playerId } = body;
      const result = takePlayerToGroup(groupId, playerId, effectiveRequesterId, effectiveIsAdmin);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 403 });
      }
      return NextResponse.json({ success: true, state: getState() });
    }

    if (action === 'return_player') {
      const { groupId, playerId } = body;
      const result = returnPlayerToQueue(groupId, playerId, effectiveRequesterId, effectiveIsAdmin);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 403 });
      }
      return NextResponse.json({ success: true, state: getState() });
    }

    if (action === 'disband_group') {
      const { groupId } = body;
      const result = disbandGroup(groupId, effectiveRequesterId, effectiveIsAdmin);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 403 });
      }
      return NextResponse.json({ success: true, state: getState() });
    }

    // ---------- ADMIN ACTIONS ----------

    if (action === 'add_clan') {
      const { name } = body;
      const result = addClan(name);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, clan: result.clan, state: getState() });
    }

    if (action === 'delete_clan') {
      const { id } = body;
      const result = deleteClan(id);
      return NextResponse.json({ success: true, state: getState() });
    }

    if (action === 'add_kb') {
      const { title, subtitle, category, content } = body;
      const topic = addKbTopic(title || 'New Topic', subtitle || '', category || 'party_comp', content || '');
      return NextResponse.json({ success: true, topic, state: getState() });
    }

    if (action === 'update_kb') {
      const { id, title, subtitle, content } = body;
      const result = updateKbTopic(id, title, subtitle, content);
      if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ success: true, state: getState() });
    }

    if (action === 'delete_kb') {
      const { id } = body;
      deleteKbTopic(id);
      return NextResponse.json({ success: true, state: getState() });
    }

    if (action === 'add_rule') {
      const { title, desc } = body;
      const rule = addCharterRule(title || 'New Rule', desc || '');
      return NextResponse.json({ success: true, rule, state: getState() });
    }

    if (action === 'update_rule') {
      const { id, title, desc } = body;
      const result = updateCharterRule(id, title, desc);
      if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ success: true, state: getState() });
    }

    if (action === 'delete_rule') {
      const { id } = body;
      deleteCharterRule(id);
      return NextResponse.json({ success: true, state: getState() });
    }

    if (action === 'get_admin_pins') {
      const state = getState();
      return NextResponse.json({
        success: true,
        pinsConfig: {
          viewerPin: state.bossViewerPin || state.pinCode || '1111',
          scoutPin: state.bossScoutPin || '1555',
          adminPin: state.bossAdminPin || state.adminPinCode || '1234',
          pinVersion: state.pinVersion || 1,
        },
      });
    }

    if (action === 'change_pin') {
      if (!effectiveIsAdmin) {
        return NextResponse.json({ error: 'Только Администратор может менять PIN' }, { status: 403 });
      }
      const { newPin } = body;
      if (!newPin || newPin.length < 4) {
        return NextResponse.json({ error: 'PIN must be at least 4 characters' }, { status: 400 });
      }
      updatePinCode(newPin);
      return NextResponse.json({ success: true, pinCode: newPin, state: getState() });
    }

    if (action === 'update_all_pins') {
      if (!effectiveIsAdmin) {
        return NextResponse.json({ error: 'Только Администратор может менять PIN' }, { status: 403 });
      }
      const { memberPin, scoutPin, adminPin, pinCode, bossScoutPin, bossAdminPin } = body;
      updateAllPins(
        memberPin || pinCode,
        scoutPin || bossScoutPin,
        adminPin || bossAdminPin
      );
      const state = getState();
      return NextResponse.json({
        success: true,
        state: getState(),
        pinsConfig: {
          viewerPin: state.bossViewerPin || state.pinCode || '1111',
          scoutPin: state.bossScoutPin || '1555',
          adminPin: state.bossAdminPin || state.adminPinCode || '1234',
          pinVersion: state.pinVersion || 1,
        },
      });
    }

    if (action === 'force_logout_sessions') {
      if (!effectiveIsAdmin) {
        return NextResponse.json({ error: 'Только Администратор может сбрасывать сессии' }, { status: 403 });
      }
      forceLogoutSessions();
      return NextResponse.json({ success: true, state: getState() });
    }

    if (action === 'reset_demo') {
      if (!effectiveIsAdmin) {
        return NextResponse.json({ error: 'Только Администратор может сбросить базу данных' }, { status: 403 });
      }
      resetToDemo();
      return NextResponse.json({ success: true, state: getState() });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('API LFG Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
