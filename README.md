# qs-nszip
网络存储对象流式压缩

## 安装
```node
npm i @quansitech/qs-nszip
```

## 介绍
流式压缩的优点是无论要压缩多大，多少的文件，都只需占用小量的内存即可完成压缩操作。

目前支持阿里云和腾讯云的对象存储服务
+ AliOss
+ TencentCos


## 用法
+ AliOss
```javascript
const NsZip = require("NsZip");

//实例化，对应的参数查看阿里云OSS配置
const nszip = new NsZip("AliOss", {
   region: "",
   accessKeyId: '',
   accessKeySecret: '',
   bucket: '',
   timeout: 3600 * 1000 * 24 //建议设置成24小时，避免当压缩大文件超时
});

//设置需压缩的源文件和目标文件
//第一个参数，需要压缩的文件列表，网络存储文件地址
//第二个参数，生成的压缩包文件
nszip.attach([
    'object1',
    'object2',
    'object3',
    ...
], 'zips/2020-11-29.zip');

//监听压缩进度
nszip.on('progress', (percent) => {
    console.log(percent);
});

//监听完成状态
nszip.on('finish', () => {
    console.log('finish');
});

nszip.run() //开始压缩，异步操作。
```

+ TencentCos
```javascript
const NsZip = require("NsZip");

//实例化，对应的参数查看腾讯云COS配置
const nszip = new NsZip("TencentCos", {
   SecretId: '',
   SecretKey: '',
   Bucket: '',
   Region: ''
});

//设置需压缩的源文件和目标文件
//第一个参数，需要压缩的文件列表，网络存储文件地址
//第二个参数，生成的压缩包文件
nszip.attach([
    'object1',
    'object2',
    'object3',
    ...
], 'zips/2020-11-29.zip');

//监听压缩进度
nszip.on('progress', (percent) => {
    console.log(percent);
});

//监听完成状态
nszip.on('finish', () => {
    console.log('finish');
});

nszip.run() //开始压缩，异步操作。
```

### 网络流压缩上传
适合一边请求网络资源，一边添加压缩流上传

+ 轮询压缩上传API

//第一个参数 可读流对象, 可以是网络流
//第二个参数 添加进压缩包的文件名
//第三个参数 需要存放网络存储的压缩文件路径

eachZip(readableStream, '文件名', '网络存储的压缩文件路径');

+ 轮询压缩结束API

//结束轮询压缩

eachZipFinish();

 PS.网络流压缩上传由于无法确定需要压缩上传的数量，因此无法预测进度完成情况， 不支持 progress事件

举例
```javascript
//监听最终完成事件
nszip.on('finish', () => {
    console.log('finish');
});

let index=0;
for(let i=0; i< 100; i++){
    fetch("http://demo.test/5ec98e24e5326.jpg").then(res => {
        const resIndex = ++index;
        
        if(res.status == 200){
            nszip.eachZip(res.body, `${i}.jpg`, 'testFillZip.zip');
            //监听流结束事件
            res.body.on('close', () => {
                //最后一个流处理结束后触发压缩完成处理
                if(resIndex == 100){
                    nszip.eachZipFinish();
                }
                console.log('resIndex:' + resIndex);
            });
        }
    });
}
```
