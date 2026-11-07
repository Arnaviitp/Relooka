const hubService = require('./hub.service');
const { successResponse } = require('../../core/utils/response');

class HubController {
  async createHub(req, res, next) {
    try {
      const hub = await hubService.createHub(req.body);
      return successResponse(res, hub, 'Hub created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async getAllHubs(req, res, next) {
    try {
      const { city, activeOnly } = req.query;
      const hubs = await hubService.getAllHubs({
        city,
        activeOnly: activeOnly === 'false' ? false : true
      });
      return successResponse(res, hubs, 'Hubs retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getHubById(req, res, next) {
    try {
      const hub = await hubService.getHubById(req.params.id);
      return successResponse(res, hub, 'Hub details retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HubController();

