const fetch = require('node-fetch');

const url = 'https://1638156193081435.cn-shenzhen.fc.aliyuncs.com/2016-08-15/proxy/cat-batch-download/cat-batch-download/';

const body = {
    "action":"run",
    "objects":["Uploads\/file\/20201209\/5fd03210769b4.jpg"],
    "output":"zip\/1_24_1608016545_5042.zip",
    "callback":"https:\/\/cat.frp.jackclub.cn\/Home\/BatchDownload\/callback\/status\/1\/id\/23.html",
    "failCallback":"https:\/\/cat.frp.jackclub.cn\/Home\/BatchDownload\/callback\/status\/2\/id\/23.html"
};
fetch(url, {
    method: 'post',
    body: JSON.stringify(body),
    headers: {'Content-Type': 'application/json'}
}).then(res => {
    return res.json();
}).then(content => {
    console.log(content);
});