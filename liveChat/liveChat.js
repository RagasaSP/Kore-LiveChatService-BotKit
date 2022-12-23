var botId = "st-82322b8f-cdd5-52a5-bd21-b08456091a8e";
var botName = "Agri_Service";
var sdk = require("../lib/sdk");
var _ = require("lodash");
var bot_config = require("../config.json");
var liveChatApi = require("./liveChatApi");
var _map = {}; //used to store secure session ids
var userDataMap = {}; //this will be use to store the data object for each user
var org_id = "";
var visitorId = "";
var registerWebhookId = "";
var enableWebhokLicence = "";
var faqEvent = "";
var isFaq = false;

async function connectToAgent(requestId, data, cb) {
  try {
    visitorId = _.get(data, "channel.channelInfos.from");
    if (!visitorId) {
      visitorId = _.get(data, "channel.from");
    }
    userDataMap[visitorId] = data;
    data.message = "An Agent will be assigned to you shortly!!!";
    sdk.sendUserMessage(data, cb);
    let customer_access_token = await liveChatApi.getCustomerToken();
    if (!org_id) {
      org_id = await liveChatApi.getOrganisationId(customer_access_token);
    }
    let result = await liveChatApi.startChat(customer_access_token, org_id);
    _map[visitorId] = {
      secured_session_id: result.chat_id,
      visitorId,
      customer_access_token,
      org_id,
      last_message_id: 0,
    };
    console.log(_map[visitorId].secured_session_id);
  } catch (error) {}
}
function isRegistered(webhooks) {
  let result = false;
  if (webhooks == null || webhooks.length == 0) {
    return false;
  }
  webhooks.forEach((value, index, arr) => {
    if (
      value.url == bot_config.livechat.redirect_url &&
      value.description == "Test webhook" &&
      value.action === "incoming_event" &&
      value.owner_client_id === bot_config.livechat.client_id
    ) {
      registerWebhookId = value.id;
      console.log(registerWebhookId);
      result = true;
    }
  });
  return result;
}
async function sendEvent(entry, requestId, data, cb) {
  var terminateMsgs = [
    "ok bye",
    "bye",
    "ok thanks",
    "thanks",
    "end",
    "discard",
    "discard all",
  ];
  if (terminateMsgs.includes(data.message)) {
    // await liveChatApi.unregisterWebhook(registerWebhookId);
    delete _map[visitorId];
    delete userDataMap[visitorId];
    let isAgentDismissed = await sdk.clearAgentSession(data);
    data.message = "Agent is dicarded.. anything i can help you with?";
    console.log(data);
    return sdk.sendUserMessage(data, cb);
  }
  let token = entry.customer_access_token;
  let org_id = entry.org_id;
  let chat_id = entry.secured_session_id;
  let msg = data.message;
  let entity_id = await liveChatApi.send_event(token, org_id, chat_id, msg);
  if (registerWebhookId === "") {
    let listWebHooks = await liveChatApi.listWebhooks();
    if (!isRegistered(listWebHooks)) {
      registerWebhookId = await liveChatApi.registerWebhook();
    }
    let isWebhokLicenceEnabled = await liveChatApi.getEnableLicenceState();
    if (!isWebhokLicenceEnabled) {
      enableWebhokLicence = await liveChatApi.enableWebhookLicence();
    }
    console.log(
      "registerWebhookId:",
      registerWebhookId,
      "enableWebhokLicence:",
      enableWebhokLicence
    );
  }
  userDataMap[visitorId] = data;
  _map[visitorId].last_message_id = entity_id;
  return sdk.sendBotMessage(data, cb);
}

function onAgentTransfer(requestId, data, callback) {
  connectToAgent(requestId, data, callback);
}

async function onUserMessage(requestId, data, cb) {
  try {
    var visitorId = _.get(data, "channel.from");
    var entry = _map[visitorId];
    if (entry) {
      return sendEvent(entry, requestId, data, cb);
    } else {
      if (data.message === "skipBotMessage") {
        return sdk.skipBotMessage(data, cb);
      } else if (data.message === "agentTransfer") {
        connectToAgent(requestId, data, cb);
      } else {
        sdk.sendBotMessage(data, cb);
      }
    }
  } catch (error) {
    delete userDataMap[visitorId];
    delete _map[visitorId];
  }
}

function onBotMessage(requestId, data, cb) {
  var visitorId = _.get(data, "channel.from");
  var entry = _map[visitorId];
  if (data.message.length === 0 || data.message === "") {
    return;
  }
  if (!entry) {
    if (faqEvent === "endFAQ" && isFaq) {
      setTimeout(function () {
        console.log("timer completed");
        return sdk.sendUserMessage(data,cb);
      }, 5000);
      isFaq = false;
    } else {
      sdk.sendUserMessage(data, cb);
    }
    // sdk.sendUserMessage(data, cb);
  } else if (data.message === "skipUserMessage") {
    sdk.skipUserMessage(data, cb);
  } else if (entry) {
    sdk.skipUserMessage(data, cb);
  } else {
    sdk.sendUserMessage(data, cb);
  }
}

async function agentMsgs(req, res) {
  if (
    req.body.payload.event.custom_id &&
    req.body.payload.event.type === "message"
  ) {
    var terminateMsgs = [
      "ok bye",
      "bye",
      "ok thanks",
      "thanks",
      "end",
      "discard",
      "discard all",
    ];
    if (terminateMsgs.includes(req.body.payload.event.text)) {
      delete _map[visitorId];
      delete userDataMap[visitorId];
      let isAgentDismissed = await sdk.clearAgentSession(data);
      data.message = "Agent is dicarded.. anything i can help you w`ith?";
      sdk.sendUserMessage(data, cb);
    } else {
      var data = userDataMap[visitorId];
      console.log(req.body.payload.event);
      data.message = req.body.payload.event.text;
      data._originalPayload.message = data.text;
      _map[visitorId].last_message_id = req.body.payload.event.id;
      sdk.sendUserMessage(data);
    }
  } else if ((req.body.payload.event.type = "system_message")) {
    console.log(req.body.payload.event.text);
  } else {
    console.log(req.body.payload.event.text);
  }
  res.send("Ok");
}

module.exports = {
  botId: botId,
  botName: botName,
  on_user_message: async function (requestId, data, callback) {
    sdk.clearAgentSession(data);
    onUserMessage(requestId, data, callback);
  },
  on_bot_message: function (requestId, data, callback) {
    onBotMessage(requestId, data, callback);
  },
  on_agent_transfer: function (requestId, data, callback) {
    onAgentTransfer(requestId, data, callback);
  },
  on_event: function (requestId, data, callback) {
    if (data.event.eventType === "endFAQ" && data.event.startNewDialog) {
      faqEvent = data.event.eventType;
      isFaq = data.event.startNewDialog;
    } else {
      return callback(null, data);
    }
  },
  agentMsgs,
};
