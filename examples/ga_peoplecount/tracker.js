const got = require('got');

const GA_TRACKING_ID = process.env.GA_TRACKING_ID;

async function trackEvent (category, action, label, value) {
  const data = {
    v: '1',
    tid: GA_TRACKING_ID,
    uid: 555,
    t: 'event',
    ec: category,
    ea: action,
    el: label,
    ev: value
  };

  try {
    await got.post('http://www.google-analytics.com/collect', {
      form: true,
      body: data,
    });
  } catch (e) {
    console.log('tracking failed');
  }
}


function trackPeopleCount(meetingRoom, numberOfPeople) {
  trackEvent('huddly-analytics', 'people-count', meetingRoom, numberOfPeople);
}

module.exports = trackPeopleCount;
