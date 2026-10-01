const store = require('../../utils/store');

Page({
  data: { trip: null, dayList: [], modalVisible: false, modalType: 'stop', editingStop: false, form: {}, types: store.TYPES, dayOptions: [], dayIndex: 0, typeIndex: 0 },

  onLoad(options) {
    this.tripId = decodeURIComponent(options.id || '');
    this.refreshTrip();
  },

  onShow() { if (this.tripId) this.refreshTrip(); },

  onShareAppMessage() {
    const trip = this.data.trip;
    return { title: trip ? `一起看看：${trip.title}` : '家游计划｜家庭旅行规划', path: '/pages/index/index' };
  },

  refreshTrip() {
    const trip = store.loadTrips().find(item => item.id === this.tripId);
    if (!trip) { this.setData({ trip: null, dayList: [] }); return; }
    const dayList = [];
    for (let day = 1; day <= trip.days; day += 1) {
      const stops = trip.stops.filter(stop => stop.day === day).sort((a, b) => a.order - b.order);
      dayList.push({ day, date: this.dateForDay(trip, day), stops });
    }
    this.setData({ trip: { ...trip, nights: Math.max(0, trip.days - 1) }, dayList });
  },

  dateForDay(trip, day) {
    if (!trip.startDate) return '';
    const parts = trip.startDate.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2] + day - 1);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  getTrips() { return store.loadTrips(); },
  goBack() { wx.navigateBack({ delta: 1 }); },
  stopTap() {},
  closeModal() { this.setData({ modalVisible: false }); },

  addStop(event) {
    const day = Number(event.currentTarget.dataset.day) || 1;
    this.openStopModal({ day, time: '', title: '', type: '景点', address: '', note: '' }, false);
  },

  editStop(event) {
    const stop = this.data.trip.stops.find(item => item.id === event.currentTarget.dataset.id);
    if (stop) this.openStopModal({ ...stop }, true);
  },

  openStopModal(form, editingStop) {
    const trip = this.data.trip;
    this.setData({
      modalVisible: true, modalType: 'stop', editingStop, form,
      dayOptions: Array.from({ length: trip.days }, (_, index) => `第 ${index + 1} 天`),
      dayIndex: Math.max(0, Number(form.day || 1) - 1),
      typeIndex: Math.max(0, store.TYPES.indexOf(form.type))
    });
  },

  editTrip() {
    const trip = this.data.trip;
    if (!trip) return;
    this.setData({ modalVisible: true, modalType: 'trip', form: { ...trip } });
  },

  onFieldInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },
  onDateChange(event) { this.setData({ 'form.startDate': event.detail.value }); },
  onDayChange(event) {
    const dayIndex = Number(event.detail.value) || 0;
    this.setData({ dayIndex, 'form.day': dayIndex + 1 });
  },
  onTimeChange(event) { this.setData({ 'form.time': event.detail.value }); },
  onTypeChange(event) {
    const typeIndex = Number(event.detail.value) || 0;
    this.setData({ typeIndex, 'form.type': store.TYPES[typeIndex] });
  },

  saveModal() {
    const trip = this.getTrips().find(item => item.id === this.tripId);
    if (!trip) return;
    const form = this.data.form;
    if (!String(form.title || '').trim()) {
      wx.showToast({ title: '请填写名称', icon: 'none' });
      return;
    }
    if (this.data.modalType === 'trip') {
      const days = Math.max(1, Math.min(30, Number(form.days) || 1));
      trip.title = String(form.title).trim();
      trip.destination = String(form.destination || '').trim();
      trip.startDate = form.startDate || '';
      trip.days = days;
      trip.people = String(form.people || '').trim();
      trip.budget = String(form.budget || '').trim();
      trip.budgetNote = String(form.budgetNote || '').trim();
      trip.stops.forEach(stop => { stop.day = Math.min(stop.day, days); });
    } else {
      const values = {
        day: Math.max(1, Math.min(trip.days, Number(form.day) || 1)), time: form.time || '',
        title: String(form.title).trim(), type: store.TYPES.indexOf(form.type) >= 0 ? form.type : '其他',
        address: String(form.address || '').trim(), note: String(form.note || '').trim()
      };
      if (this.data.editingStop) {
        const stop = trip.stops.find(item => item.id === form.id);
        if (stop) {
          const movedDay = stop.day !== values.day;
          Object.assign(stop, values);
          if (movedDay) stop.order = (trip.stops.filter(item => item.day === values.day && item.id !== stop.id).reduce((max, item) => Math.max(max, item.order), 0) || 0) + 10;
        }
      } else {
        const sameDay = trip.stops.filter(item => item.day === values.day);
        trip.stops.push({ ...values, id: store.makeId(), order: (sameDay.reduce((max, item) => Math.max(max, item.order), 0) || 0) + 10 });
      }
    }
    trip.updatedAt = Date.now();
    store.saveTrips(this.getTrips().map(item => item.id === trip.id ? trip : item));
    this.setData({ modalVisible: false });
    this.refreshTrip();
    wx.showToast({ title: '已保存', icon: 'none' });
  },

  moveStop(event) {
    const day = Number(event.currentTarget.dataset.day);
    const index = Number(event.currentTarget.dataset.index);
    const direction = Number(event.currentTarget.dataset.dir);
    const trips = this.getTrips();
    const trip = trips.find(item => item.id === this.tripId);
    if (!trip) return;
    const stops = trip.stops.filter(stop => stop.day === day).sort((a, b) => a.order - b.order);
    const otherIndex = index + direction;
    if (otherIndex < 0 || otherIndex >= stops.length) return;
    const order = stops[index].order;
    stops[index].order = stops[otherIndex].order;
    stops[otherIndex].order = order;
    trip.updatedAt = Date.now();
    store.saveTrips(trips);
    this.refreshTrip();
  },

  deleteStop(event) {
    const id = event.currentTarget.dataset.id;
    const trips = this.getTrips();
    const trip = trips.find(item => item.id === this.tripId);
    const stop = trip && trip.stops.find(item => item.id === id);
    if (!trip || !stop) return;
    wx.showModal({ title: '删除地点', content: `确定删除“${stop.title}”吗？`, success: result => {
      if (!result.confirm) return;
      trip.stops = trip.stops.filter(item => item.id !== id);
      trip.updatedAt = Date.now();
      store.saveTrips(trips);
      this.refreshTrip();
    } });
  },

  copyAddress(event) {
    const stop = this.data.trip.stops.find(item => item.id === event.currentTarget.dataset.id);
    if (!stop) return;
    const text = stop.address || stop.title;
    wx.setClipboardData({ data: text, success: () => wx.showToast({ title: '导航关键词已复制', icon: 'none' }) });
  },

  copyPlan() {
    if (!this.data.trip) return;
    const text = store.exportBackup([this.data.trip]);
    wx.setClipboardData({ data: text, success: () => wx.showToast({ title: '计划 JSON 已复制', icon: 'none' }) });
  }
});
