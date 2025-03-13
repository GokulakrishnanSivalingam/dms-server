const User = require('../models/User');
const axios = require('axios');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('name phone');
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

exports.sendAlert = async (req, res) => {
  try {
    const { message, messageType } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const users = await User.find({}).select('name phone');
    
    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users found'
      });
    }

    // Format message with header and footer
    const formatMessage = (userName) => {
      return `🚨 *EMERGENCY ALERT* 🚨\n\n` +
        `Dear ${userName},\n` +
        `${message}\n\n` +
        `🔸 Important Instructions:\n` +
        `2/5/2025 12:00 PM  new cyclone will cross the coast of chennai.\n` +
        `1. Stay home donot go out.\n` +
        `2. keep your electronics item safe \n` +
        `3. buy food and water .\n` +
        `4. Share this information with others\n\n` +
        
        `For immediate assistance:\n` +
        `📞 Emergency: 112\n` +
        `🚑 Ambulance: 108\n` +
        `🚒 Fire: 101\n\n` +
        `Stay safe!\n` +
        `visit:  www.crisiz.online\n` +
        `            - Crisiz Team`;
    };

    const formatPhoneNumber = (phone) => {
      const cleanNumber = phone.replace(/\D/g, '');
      
      const numberWithoutPrefix = cleanNumber.replace(/^(\+?91)/, '');
      
      if (numberWithoutPrefix.length !== 10) {
        throw new Error('Invalid phone number length');
      }
      
      return `91${numberWithoutPrefix}`;
    };

    if (messageType === 'whatsapp') {
      const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
      const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN;
      const API_URL = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`;

      let successCount = 0;
      let failureCount = 0;
      const errors = [];

      for (const user of users) {
        try {
          const formattedPhoneNumber = formatPhoneNumber(user.phone);
          const formattedMessage = formatMessage(user.name);
          
          console.log(`Sending message to: ${formattedPhoneNumber}`);

          const response = await axios.post(API_URL, 
            {
              token: ULTRAMSG_TOKEN,
              to: formattedPhoneNumber,
              body: formattedMessage,
              priority: 1,
              referenceId: `emergency_${Date.now()}`
            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('API Response:', response.data);

          if (response.data.status === 'success') {
            successCount++;
            console.log(`✅ Message sent successfully to ${user.name} (${formattedPhoneNumber})`);
          } else {
            failureCount++;
            errors.push({
              phone: user.phone,
              name: user.name,
              error: 'Failed to send message',
              response: response.data

            });
            console.error(`❌ Failed to send to ${user.name}:`, response.data);
          }
        } catch (error) {
          failureCount++;
          errors.push({
            phone: user.phone,
            name: user.name,
            error: error.message
          });
          console.error(`❌ Error sending to ${user.name}:`, error.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: `WhatsApp messages: ${successCount} sent, ${failureCount} failed`,
        details: {
          total: users.length,
          successful: successCount,
          failed: failureCount,
          errors
        }
      });
    } else {
      // SMS logic
      const smsResults = users.map(user => ({
        name: user.name,
        phone: user.phone,
        message: formatMessage(user.name)
      }));

      return res.status(200).json({
        success: true,
        message: `Alert prepared for ${users.length} users`,
        details: {
          total: users.length,
          messages: smsResults
        }
      });
    }

  } catch (error) {
    console.error('Error in sendAlert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process alert',
      error: error.message
    });
  }
}; 
