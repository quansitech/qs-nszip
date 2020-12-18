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

## API
+ 添加需要压缩的存储对象

//第一个参数 需要压缩的存储对象数组

//第二个参数 生成的压缩对象

attach([object1, object2, ...], zipObject);


+ 开始压缩并上传

run() //配合attach使用

+ 监听事件

//event: 'progress', 'finish', 'abort', 'error'

//progress事件返回进度百分比 (eachZip模式由于无法预先确定需要处理的总量，因此不会触发progress事件)

//finish事件 在压缩上传完成后触发

//abort事件 调用abortZip方法后触发

//error事件 产生异常时触发，并且返回异常对象

on(event, function callback(){})

+ 轮询压缩上传

//第一个参数 可读流对象, 可以是网络流

//第二个参数 添加进压缩包的文件名

//第三个参数 需要存放网络存储的压缩文件路径

eachZip(readableStream, '文件名', '网络存储的压缩文件路径');

 PS.网络流压缩上传由于无法确定需要压缩上传的数量，因此无法预测进度完成情况， 不支持 progress事件

+ 轮询压缩完成

//完成轮询压缩

eachZipFinish();

+ 中止压缩

//上传流会销毁，并清空上传碎片和文件

abortZip();


## 用法

1. 获取网络存储对象，并压缩上传回网络存储
+ AliOss
```javascript
const NsZip = require("@quansitech/NsZip");

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
const NsZip = require("@quansitech/NsZip");

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

2. 一边下载网络资源，一边压缩上传至网络存储
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
                if(res.body.eachZipindex == 100){
                    nszip.eachZipFinish();
                }
            });
        }
    });
}
```


#### 自定义分片大小

实例化时设置option.miniChunkSize

```javascript
const nszip = new NsZip("TencentCos", {
   SecretId: '',
   SecretKey: '',
   Bucket: '',
   Region: '',
   miniChunkSize: 100 * 1024*1024 //100Mb
});
```

#### 打包压缩处理后图片

attach方法的第一个参数的数组元素支持对象，对象格式为 { object: $key, process: $process}

process 的格式根据不同平台的格式而定

```javascript

//腾讯云cos
nszip.attach([
    { object: 'smaple.jpg', process: 'watermark/1/image/aHR0cDovL2V4YW1wbGVzLTEyNTEwMDAwMDQucGljc2gubXlxY2xvdWQuY29tL3NodWl5aW4uanBn/gravity/southeast'},
    'object2',
    'object3',
    ...
], 'zips/2020-11-29.zip');


//aliyun oss
nszip.attach([
    { object: 'smaple.jpg', process: 'image/resize,m_fixed,w_100,h_100'},
    'object2',
    'object3',
    ...
], 'zips/2020-11-29.zip');
```