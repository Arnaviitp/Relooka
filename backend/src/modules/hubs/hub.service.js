const Hub = require('./hub.model');
const AppError = require('../../core/utils/AppError');

class HubService {
  async createHub(data) {
    const existing = await Hub.findOne({ code: data.code.toUpperCase() });
    if (existing) {
      throw new AppError(`Hub code ${data.code} already exists`, 409, 'HUB_CODE_EXISTS');
    }
    return Hub.create({
      ...data,
      code: data.code.toUpperCase()
    });
  }

  async getAllHubs({ city, activeOnly = true } = {}) {
    const filter = {};
    if (city) filter.city = new RegExp(city, 'i');
    if (activeOnly) filter.isActive = true;
    return Hub.find(filter).sort({ name: 1 });
  }

  async getHubById(hubId) {
    const hub = await Hub.findById(hubId);
    if (!hub) {
      throw new AppError('Partner laundry hub not found', 404, 'HUB_NOT_FOUND');
    }
    return hub;
  }

  async findAvailableHub(pincode) {
    // Look for matching pincode or first active hub as fallback
    let hub = await Hub.findOne({ pincode, isActive: true });
    if (!hub) {
      hub = await Hub.findOne({ isActive: true });
    }
    return hub;
  }
}

module.exports = new HubService();
