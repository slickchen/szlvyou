const STORE_KEY = 'jiayou-plan-v1';
const TYPES = ['景点', '酒店', '餐饮', '交通', '滑雪', '其他'];

function makeId() {
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function starterTrip() {
  return {
    id: makeId(), title: '深圳三天两夜自驾游', destination: '广州 → 深圳南山 / 宝安', startDate: '', days: 3,
    people: '一家人', budget: '¥4,500–9,300（2位成人参考）',
    budgetNote: '酒店 2 晚 ¥1,800–5,000；两园门票 ¥780–960；前海初级道 3 小时 ¥700–1,100；3 天餐饮 ¥900–1,500；油费 + 高速 ¥300–500；停车 ¥50–200。未含儿童票差价、教练、额外雪具和购物。价格随日期变化，下单前请核对官方预订页。',
    updatedAt: Date.now(),
    stops: [
      { id: makeId(), day: 1, time: '07:00', title: '广州出发', type: '交通', address: '广州 → 深圳', note: '出发前查看实时路况；途中安排休息。', order: 10 },
      { id: makeId(), day: 1, time: '11:00', title: '世界之窗', type: '景点', address: '深圳市南山区深南大道 9037 号', note: '先在酒店停车、寄存行李，再步行入园；查看当天演出安排。', order: 20 },
      { id: makeId(), day: 1, time: '21:00', title: '深圳益田威斯汀酒店', type: '酒店', address: '深圳市南山区深南大道 9028-2 号', note: '入住后休息，停车政策以酒店确认为准。', order: 30 },
      { id: makeId(), day: 2, time: '09:30', title: '深圳欢乐谷', type: '景点', address: '深圳市南山区华侨城西街 1 号', note: '先查看项目检修和演出表，按家人体力安排。', order: 10 },
      { id: makeId(), day: 2, time: '19:00', title: '晚餐 / 回酒店休息', type: '餐饮', address: '世界之窗 / 益田假日广场周边', note: '为第三天滑雪留足体力。', order: 20 },
      { id: makeId(), day: 3, time: '08:30', title: '退房，前往前海冰雪世界', type: '交通', address: '深圳市宝安区滨江大道 666 号', note: '确认雪票时段、停车位置和装备包含项目。', order: 10 },
      { id: makeId(), day: 3, time: '10:00', title: '华发冰雪热雪奇迹｜初级道滑雪', type: '滑雪', address: '深圳市宝安区滨江大道 666 号', note: '按套餐和时段预订；确认手套、雪镜等是否包含。', order: 20 },
      { id: makeId(), day: 3, time: '14:00', title: '返程回广州', type: '交通', address: '深圳 → 广州', note: '午餐后查看实时路况，避开疲劳驾驶。', order: 30 }
    ]
  };
}

function normalizeTrip(trip) {
  if (!trip || typeof trip !== 'object') return null;
  const days = Math.max(1, Math.min(30, Number(trip.days) || 1));
  return {
    id: String(trip.id || makeId()), title: String(trip.title || '未命名旅行'),
    destination: String(trip.destination || ''), startDate: String(trip.startDate || ''), days,
    people: String(trip.people || ''), budget: String(trip.budget || ''), budgetNote: String(trip.budgetNote || ''), updatedAt: Number(trip.updatedAt) || Date.now(),
    stops: Array.isArray(trip.stops) ? trip.stops.map((stop, index) => ({
      id: String(stop.id || makeId()), day: Math.max(1, Math.min(days, Number(stop.day) || 1)),
      time: String(stop.time || ''), title: String(stop.title || '未命名地点'),
      type: TYPES.indexOf(stop.type) >= 0 ? stop.type : '其他', address: String(stop.address || ''),
      note: String(stop.note || ''), order: Number(stop.order) || (index + 1) * 10
    })) : []
  };
}

function loadTrips() {
  try {
    const saved = wx.getStorageSync(STORE_KEY);
    if (saved && Array.isArray(saved.trips)) return saved.trips.map(normalizeTrip).filter(Boolean);
  } catch (error) { /* Use the sample plan when local storage cannot be read. */ }
  const trips = [starterTrip()];
  saveTrips(trips);
  return trips;
}

function saveTrips(trips) {
  wx.setStorageSync(STORE_KEY, { version: 1, trips });
}

function cloneTrip(trip, title) {
  const copy = JSON.parse(JSON.stringify(trip));
  copy.id = makeId();
  copy.title = title || `${trip.title}（副本）`;
  copy.updatedAt = Date.now();
  copy.stops = copy.stops.map(stop => ({ ...stop, id: makeId() }));
  return copy;
}

function parseBackup(text) {
  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.trips) ? parsed.trips : (parsed.trip ? [parsed.trip] : []));
  const imported = list.map(normalizeTrip).filter(Boolean).map(trip => cloneTrip(trip, trip.title));
  if (!imported.length) throw new Error('备份里没有旅行计划');
  return imported;
}

function exportBackup(trips) {
  return JSON.stringify({ app: 'jiayou-plan-v1', version: 1, exportedAt: new Date().toISOString(), trips }, null, 2);
}

module.exports = { TYPES, makeId, starterTrip, normalizeTrip, loadTrips, saveTrips, cloneTrip, parseBackup, exportBackup };
