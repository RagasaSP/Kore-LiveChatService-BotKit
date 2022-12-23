var template = require("url-template");
var bot_config = require("../config.json");
const axios = require("axios");

var customerTokenUrl = "https://accounts.livechat.com/customer/token";
var orgIdUrl =
  "https://api.livechatinc.com/v3.4/customer/action/get_dynamic_configuration?license_id={license_id}";
var startChatUrl =
  "https://api.livechatinc.com/v3.4/customer/action/start_chat?organization_id={organization_id}";
var sendEventUrl =
  "https://api.livechatinc.com/v3.4/customer/action/send_event?organization_id={organization_id}";
var register_webhook =
  "https://api.livechatinc.com/v3.4/configuration/action/register_webhook";
var unregister_webhook =
  "https://api.livechatinc.com/v3.4/configuration/action/unregister_webhook";
var enable_license_webhooks =
  "https://api.livechatinc.com/v3.4/configuration/action/enable_license_webhooks";
var disable_license_webhooks =
  "https://api.livechatinc.com/v3.4/configuration/action/disable_license_webhooks";
var get_license_webhooks_state =
  "https://api.livechatinc.com/v3.4/configuration/action/get_license_webhooks_state";
var list_webhooks =
  "https://api.livechatinc.com/v3.4/configuration/action/list_webhooks";

function getCustomerToken() {
  var url = customerTokenUrl;
  var payload = {
    grant_type: bot_config.livechat.grant_type,
    client_id: bot_config.livechat.client_id,
    license_id: bot_config.livechat.license_id,
    redirect_uri: bot_config.livechat.redirect_url,
  };
  var config = {
    url: url,
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    data: payload,
  };
  return new Promise((resolve, reject) => {
    axios(config)
      .then((res) => {
        console.log(res.data.access_token);
        resolve(res.data.access_token);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}
function getOrganisationId(customer_access_token) {
  var url = template
    .parse(orgIdUrl)
    .expand({ license_id: bot_config.livechat.license_id });
  var config = {
    url: url,
    method: "get",
    headers: {
      Authorization: "Bearer " + customer_access_token,
    },
  };
  return new Promise((resolve, reject) => {
    axios(config)
      .then((res) => {
        console.log(res.data.organization_id);
        resolve(res.data.organization_id);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}
function startChat(customer_access_token, org_id) {
  var url = template.parse(startChatUrl).expand({ organization_id: org_id });
  var config = {
    url: url,
    method: "post",
    headers: {
      Authorization: "Bearer " + customer_access_token,
      "Content-Type": "application/json",
    },
    data: {},
  };
  return new Promise((resolve, reject) => {
    axios(config)
      .then((res) => {
        console.log(res.data);
        resolve(res.data);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}

function send_event(customer_access_token, org_id, chat_id, msg) {
  var url = template.parse(sendEventUrl).expand({ organization_id: org_id });
  var config = {
    url: url,
    method: "post",
    headers: {
      Authorization: "Bearer " + customer_access_token,
      "Content-Type": "application/json",
    },
    data: {
      chat_id: chat_id,
      event: {
        type: "message",
        text: msg,
        recipients: "all",
      },
    },
  };
  return new Promise((resolve, reject) => {
    axios(config)
      .then((res) => {
        console.log(res.data);
        resolve(res.data);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}

function registerWebhook() {
  var url = register_webhook;
  var config = {
    url: url,
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    auth: {
      username: bot_config.livechat.pat.acc_id,
      password: bot_config.livechat.pat.token,
    },
    data: {
      url: bot_config.livechat.redirect_url,
      description: "Test webhook",
      action: "incoming_event",
      secret_key: "12345678",
      owner_client_id: bot_config.livechat.client_id,
      type: "license",
    },
  };
  return new Promise((resolve, reject) => {
    axios(config)
      .then((res) => {
        console.log(res.data.id);
        resolve(res.data.id);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}

function unregisterWebhook(registerId) {
  var url = unregister_webhook;
  var config = {
    url: url,
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    auth: {
      username: bot_config.livechat.pat.acc_id,
      password: bot_config.livechat.pat.token,
    },
    data: {
      id: registerId,
      owner_client_id: bot_config.livechat.client_id,
    },
  };
  return new Promise((resolve, reject) => {
    axios(config)
      .then((res) => {
        console.log(res.status);

        resolve(res.status);
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}

function enableWebhookLicence() {
  var url = enable_license_webhooks;
  var config = {
    url: url,
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    auth: {
      username: bot_config.livechat.pat.acc_id,
      password: bot_config.livechat.pat.token,
    },
    data: {
      owner_client_id: bot_config.livechat.client_id,
    },
  };
  return new Promise((resolve, reject) => {
    axios(config)
      .then((res) => {
        console.log(res.status);
        if (res.status == 200) {
          resolve(true);
        }
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}
function disableWebhookLicence() {
  var url = disable_license_webhooks;
  var config = {
    url: url,
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    auth: {
      username: bot_config.livechat.pat.acc_id,
      password: bot_config.livechat.pat.token,
    },
    data: {
      owner_client_id: bot_config.livechat.client_id,
    },
  };
  return new Promise((resolve, reject) => {
    axios(config)
      .then((res) => {
        console.log(res.status);
        if (res.status == 200) {
          resolve(true);
        }
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}

async function getEnableLicenceState() {
  var url = get_license_webhooks_state;
  var config = {
    url: url,
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    auth: {
      username: bot_config.livechat.pat.acc_id,
      password: bot_config.livechat.pat.token,
    },
    data: {
      owner_client_id: bot_config.livechat.client_id,
    },
  };
  return new Promise((resolve, reject) => {
    axios(config)
      .then((res) => {
        console.log(res.status);
        if (res.status == 200) {
          resolve(res.data.license_webhooks_enabled);
        }
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}
function listWebhooks() {
  var url = list_webhooks;
  var config = {
    url: url,
    method: "post",
    headers: {
      "Content-Type": "application/json",
    },
    auth: {
      username: bot_config.livechat.pat.acc_id,
      password: bot_config.livechat.pat.token,
    },
    data: {
      owner_client_id: bot_config.livechat.client_id,
    },
  };
  return new Promise((resolve, reject) => {
    axios(config)
      .then((res) => {
        console.log(res.status);
        if (res.status == 200) {
          resolve(res.data);
        }
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}

module.exports = {
  getCustomerToken,
  getOrganisationId,
  startChat,
  send_event,
  registerWebhook,
  unregisterWebhook,
  enableWebhookLicence,
  disableWebhookLicence,
  getEnableLicenceState,
  listWebhooks,
};
