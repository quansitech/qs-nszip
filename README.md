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
//第一个参数，需要压缩的文件列表
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
//第一个参数，需要压缩的文件列表
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