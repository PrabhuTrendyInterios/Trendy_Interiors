const MeetingRequest = require('../models/MeetingRequest');

exports.getMeetingRequests = async (req, res) => {
  try {
    const meetingRequests = await MeetingRequest.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: meetingRequests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMeetingRequestById = async (req, res) => {
  try {
    const meetingRequest = await MeetingRequest.findById(req.params.id);
    if (!meetingRequest) {
      return res.status(404).json({ success: false, message: 'Meeting request not found' });
    }
    return res.status(200).json({ success: true, data: meetingRequest });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMeetingRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const meetingRequest = await MeetingRequest.findById(req.params.id);
    if (!meetingRequest) {
      return res.status(404).json({ success: false, message: 'Meeting request not found' });
    }

    meetingRequest.status = status;
    await meetingRequest.save();

    return res.status(200).json({ success: true, data: meetingRequest });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMeetingRequest = async (req, res) => {
  try {
    const meetingRequest = await MeetingRequest.findByIdAndDelete(req.params.id);

    if (!meetingRequest) {
      return res.status(404).json({ success: false, message: 'Meeting request not found' });
    }

    return res.status(200).json({ success: true, data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
