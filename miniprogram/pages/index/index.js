const store = require('../../utils/store');

Page({
  data: { trips: [], filteredTrips: [], query: '', modalVisible: false, form: {} },

  onLoad() { this.refreshTrips(); },

  onShow() { this.refreshTrips(); },

  onShareAppMessage() {
    return { title: '家游计划｜一起安排家庭旅行', path: '/pages/index/index' };
  },

  refreshTrips() {
    const trips = store.loadTrips().map(trip => ({
      ...trip, nights: Math.max(0, trip.days - 1), stopCount: trip.stops.length
    }));
    this.setData({ trips }, () => this.filterTrips());
  },

  filterTrips() {
    const query = (this.data.query || '').trim().toLowerCase();
    const filteredTrips = this.data.trips.filter(trip => `${trip.title} ${trip.destination}`.toLowerCase().indexOf(query) >= 0);
    this.setData({ filteredTrips });
  },

  onSearch(event) { this.setData({ query: event.detail.value }, () => this.filterTrips()); },

  openTrip(event) {
    const id = event.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/trip/trip?id=${encodeURIComponent(id)}` });
  },

  newTrip() {
    this.setData({ modalVisible: true, form: { title: '', destination: '', startDate: '', days: 3, people: '', budget: '', budgetNote: '' } });
  },

  closeModal() { this.setData({ modalVisible: false }); },
  stopTap() {},

  onFieldInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  onDateChange(event) { this.setData({ 'form.startDate': event.detail.value }); },

  saveTrip() {
    const form = this.data.form;
    if (!String(form.title || '').trim()) {
      wx.showToast({ title: '请填写计划名称', icon: 'none' });
      return;
    }
    const trip = {
      id: store.makeId(), title: String(form.title).trim(), destination: String(form.destination || '').trim(),
      startDate: form.startDate || '', days: Math.max(1, Math.min(30, Number(form.days) || 1)),
      people: String(form.people || '').trim(), budget: String(form.budget || '').trim(), budgetNote: String(form.budgetNote || '').trim(),
      updatedAt: Date.now(), stops: []
    };
    const trips = store.loadTrips();
    trips.unshift(trip);
    store.saveTrips(trips);
    this.setData({ modalVisible: false });
    this.refreshTrips();
    wx.navigateTo({ url: `/pages/trip/trip?id=${encodeURIComponent(trip.id)}` });
  },

  duplicateTrip(event) {
    const trips = store.loadTrips();
    const source = trips.find(trip => trip.id === event.currentTarget.dataset.id);
    if (!source) return;
    trips.unshift(store.cloneTrip(source));
    store.saveTrips(trips);
    this.refreshTrips();
    wx.showToast({ title: '已复制计划，可继续编辑', icon: 'none' });
  },

  deleteTrip(event) {
    const id = event.currentTarget.dataset.id;
    const trips = store.loadTrips();
    const trip = trips.find(item => item.id === id);
    if (!trip) return;
    wx.showModal({
      title: '删除旅行计划', content: `确定删除“${trip.title}”吗？`,
      success: result => {
        if (!result.confirm) return;
        store.saveTrips(trips.filter(item => item.id !== id));
        this.refreshTrips();
      }
    });
  },

  copyBackup() {
    wx.setClipboardData({ data: store.exportBackup(store.loadTrips()), success: () => wx.showToast({ title: '备份 JSON 已复制', icon: 'none' }) });
  },

  importBackup() {
    wx.getClipboardData({
      success: result => {
        try {
          const incoming = store.parseBackup(result.data);
          const trips = [...incoming, ...store.loadTrips()];
          wx.showModal({
            title: '导入备份', content: `发现 ${incoming.length} 份计划，将追加到本机，不覆盖现有内容。继续吗？`,
            success: choice => {
              if (!choice.confirm) return;
              store.saveTrips(trips);
              this.refreshTrips();
              wx.showToast({ title: `已导入 ${incoming.length} 份`, icon: 'none' });
            }
          });
        } catch (error) {
          wx.showModal({ title: '没有找到可用备份', content: '请先复制家游计划导出的 JSON，再回到这里导入。', showCancel: false });
        }
      },
      fail: () => wx.showToast({ title: '剪贴板暂不可用', icon: 'none' })
    });
  }
});
