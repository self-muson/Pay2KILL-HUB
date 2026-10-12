import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import {
  getBossState,
  heartbeatSpectator,
  removeSpectator,
  setBossDeath,
  resetBossState,
  setServerBossCamera,
  occupyBossSpot,
  leaveBossSpot,
  triggerServerSpawnAlert,
  cancelServerSpawnAlert,
  triggerServerReadyCheck,
  confirmServerReadyCheck,
  occupyServerAccount,
  releaseServerAccount,
  addServerCustomAccount,
  updateServerCustomAccount,
  deleteServerCustomAccount,
  deleteServerAuthorGroup,
  updateServerBossDetails,
  addServerBoss,
  deleteServerBoss,
  syncBossStateWithFirestore,
} from '@/lib/boss-server-store';

export async function GET() {
  await syncBossStateWithFirestore();
  const state = getBossState();
  return NextResponse.json(state);
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'heartbeat') {
      const { spectator } = body;
      if (spectator && spectator.nickname) {
        heartbeatSpectator(spectator);
      }
      return NextResponse.json({ success: true, state: getBossState() });
    }

    if (action === 'leave_tribune') {
      const { spectatorId } = body;
      if (spectatorId) {
        removeSpectator(spectatorId);
      }
      return NextResponse.json({ success: true, state: getBossState() });
    }

    if (action === 'set_tod_now') {
      const { bossId, authorNick, todTimestamp } = body;
      const nowMs = typeof todTimestamp === 'number' ? todTimestamp : Date.now();
      const pad = (n: number) => String(n).padStart(2, '0');
      const now = new Date(nowMs);
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const result = setBossDeath(bossId, timeStr, authorNick, nowMs);
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'set_tod_custom') {
      const { bossId, todStr, authorNick, todTimestamp } = body;
      const result = setBossDeath(bossId, todStr, authorNick, todTimestamp);
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'set_boss_camera') {
      const { bossId, data } = body;
      const result = setServerBossCamera(bossId, data || {});
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'reset_boss') {
      const { bossId } = body;
      const result = resetBossState(bossId);
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'occupy_spot') {
      const { bossId, spotter } = body;
      if (!bossId || !spotter) {
        return NextResponse.json({ error: 'Не указан босс или персонаж' }, { status: 400 });
      }
      const result = occupyBossSpot(bossId, spotter);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, boss: result.boss, state: getBossState() });
    }

    if (action === 'leave_spot') {
      const { bossId, userNick, isScoutOrAdmin } = body;
      const result = leaveBossSpot(bossId, userNick, isScoutOrAdmin);
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'trigger_spawn_alert') {
      const { bossId, pressedBy } = body;
      const result = triggerServerSpawnAlert(bossId, pressedBy);
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'cancel_spawn_alert') {
      const { bossId, cancelledBy } = body;
      const result = cancelServerSpawnAlert(bossId, cancelledBy);
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'trigger_ready_check') {
      const { bossId, requestedBy } = body;
      const result = triggerServerReadyCheck(bossId, requestedBy);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'confirm_ready_check') {
      const { bossId } = body;
      const result = confirmServerReadyCheck(bossId);
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'occupy_account') {
      const { groupId, camCode, user } = body;
      const result = occupyServerAccount(groupId, camCode, user);
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'release_account') {
      const { groupId } = body;
      const result = releaseServerAccount(groupId);
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'add_custom_account') {
      const { accountData } = body;
      const result = addServerCustomAccount(accountData);
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'update_custom_account') {
      const { groupId, accountData } = body;
      const result = updateServerCustomAccount(groupId, accountData);
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'delete_custom_account') {
      const { groupId } = body;
      const result = deleteServerCustomAccount(groupId);
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'delete_author_group') {
      const { groupName } = body;
      const result = deleteServerAuthorGroup(groupName);
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'update_boss_details') {
      const { bossId, updates } = body;
      const result = updateServerBossDetails(bossId, updates);
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'add_boss') {
      const { bossData } = body;
      const result = addServerBoss(bossData);
      return NextResponse.json({ ...result, state: getBossState() });
    }

    if (action === 'delete_boss') {
      const { bossId } = body;
      const result = deleteServerBoss(bossId);
      return NextResponse.json({ ...result, state: getBossState() });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('API Bosses Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
