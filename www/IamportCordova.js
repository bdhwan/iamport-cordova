var exec = require('cordova/exec');
var REDIRECT_URL = 'http://localhost/iamport';

var iamport = function(type, params) {
  var titleOptions = params.titleOptions;
  var userCode = params.userCode;
  var data = params.data;
  var callback = params.callback

  /* 타이틀 설정 */
  var titleData = {};
  if (titleOptions) {
    titleData.text = titleOptions.text || '아임포트 코르도바 예제',
    titleData.show = [true, false].indexOf(titleOptions.show) === -1 ? 'true' : titleOptions.show.toString(),
    titleData.textColor = titleOptions.textColor || '#ffffff';
    titleData.textSize = titleOptions.textSize ? titleOptions.textSize.toString() : '20';
    titleData.textAlignment = titleOptions.textAlignment || 'left';
    titleData.backgroundColor = titleOptions.backgroundColor || '#344e81';
    titleData.leftButtonType = titleOptions.leftButtonType || 'back';
    titleData.leftButtonColor = titleOptions.leftButtonColor || titleData.textColor;
    titleData.rightButtonType = titleOptions.rightButtonType || 'close';
    titleData.rightButtonColor = titleOptions.rightButtonColor || titleData.textColor;
  } else {
    titleData.show = false;
  }


  /* 결제/본인인증 데이터 설정 */
  var iamportData = {
    userCode: userCode,
    data: Object.assign({}, data, { m_redirect_url: REDIRECT_URL, niceMobileV2: true }),
    triggerCallback: triggerCallback.toString(),
    redirectUrl: REDIRECT_URL,
  };

  var successCallback = function(url) {
    if (url.indexOf(REDIRECT_URL) == 0) {
      var decodedUrl = decodeURIComponent(url);
      var query = decodedUrl.substring(REDIRECT_URL.length + 1); // [REDIRECT_URL]? 이후로 자름
      var parsedQuery = parseQuery(query);
      if (device.platform == 'iOS' && type == 'inicis') {
        var { imp_uid, merchant_uid } = parsedQuery;
        var response = {
          imp_uid,
          merchant_uid: typeof merchant_uid === 'object' ? merchant_uid[0] : merchant_uid,
        };
        callback(response);
      } else {
        var imp_success = Object.keys(parsedQuery).indexOf('imp_success') == -1 ? parsedQuery.success : parsedQuery.imp_success;
        var response = {
          imp_success: imp_success,
          imp_uid: parsedQuery.imp_uid,
          merchant_uid: parsedQuery.merchant_uid,
          error_code: parsedQuery.error_code,
          error_msg: parsedQuery.error_msg,
        };
        callback(response);
      }
    }
  };

  var failureCallback = function(message) {
    var response = {
      imp_success: 'false',
      imp_uid: null,
      merchant_uid: data.merchant_uid,
      error_code: 'IAMPORT_CORDOVA',
      error_msg: message,
    };

    callback(response);
  };

  exec(
    successCallback,
    failureCallback,
    'IamportCordova',
    'startActivity',
    [type, titleData, iamportData]
  );
} 

var getType = function(data) {
  var pg = data.pg;
  var method = data.pay_method;

  if (method == 'trans') {
    if (pg.includes('html5_inicis')) {
      return 'inicis';
    }
    if (pg.includes('nice')) {
      return 'nice';
    }
  }
  return 'payment';
}

var triggerCallback = function(response) {
  var query = [];
  Object.keys(response).forEach(function(key) {
    query.push(key + '=' + decodeURIComponent(response[key]));
  });
  location.href = 'http://localhost/iamport?' + query.join('&');
};

var parseQuery = function(query) {
  var obj = {};
  var arr = decodeURIComponent(query).split('&');
  for (var i = 0; i < arr.length; i++) {
    var pair = arr[i].split('=');
    obj[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }

  return obj;
}

exports.payment = function(params) {
  var data = params.data;
  var type = getType(data);
  iamport(type, params);
};
exports.certification = function(params) {
  iamport('certification', params);
}