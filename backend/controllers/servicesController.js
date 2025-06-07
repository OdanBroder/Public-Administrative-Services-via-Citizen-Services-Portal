import Service from "../models/Service.js";
import Office from "../models/Office.js";
// Controller to get all services with optional office filter
export async function getAllServices(req, res){
  try {
    const { officeId } = req.query;
    
    // Base query options with Office association
    const queryOptions = {
      include: [{
        model: Office,
        as: 'office',
        attributes: ['id', 'name', 'description']
      }],
      order: [['name', 'ASC']]
    };
    
    // Add office filter if provided
    if (officeId) {
      queryOptions.where = { office_id: officeId };
    }
    
    // Fetch services based on query options
    const services = await Service.findAll(queryOptions);
    
    // Return success response with services
    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ',
      error: error.message
    });
  }
};

// Controller to get all offices (for filter dropdown)
export async function getAllOffices(req, res){
  try {
    const offices = await Office.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: offices.length,
      data: offices
    });
  } catch (error) {
    console.error('Error fetching offices:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ',
      error: error.message
    });
  }
};