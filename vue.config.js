const path = require('path')
const uglifyJsPlugin = require('uglifyjs-webpack-plugin')

//生活环境
const isProduction = process.env.NODE_ENV ==='production'

function resolve(dir){
    return path.join(__dirname,dir)
}

module.exports = {
    publicPath:'./', //baseUrl
    outputDir:'dist', //输出文件的目录
    lintOnSave:false,//eslint-loader在保存的时候进行检查
    devServer:{
        compress:false,//压缩代码
        open:true,//npm serve 自动打开浏览器
        // //跨域请求
        // proxy:{
        //     '/api':{
        //         target:'http://xxxx.com',//需要代理的服务器
        //         ws:true,//websocket
        //         pathRewrite:{
        //             '/api':'/'//重写
        //         }
        //     }
        // }
    },
    //css相关配置
    css:{
        //是否使用css分离插件
        extract:true,
        //处理之后的代码和之前的代码的定位，方便开发人员的错误定位，true打包时间大大增加
        sourceMap:false,
        //css预处理器
        loaderOptions:{
            sass: {
                prependData: `
                  @import "@/assets/common/index.scss";
                `
              }
        },
        //是否启用css
        requireModuleExtension: false
    },
    chainWebpack:config => {
        //配置别名 就是从resolve拿到的东西骑个别名
        config.resolve.alias
        .set("@",resolve("src"))
        .set("@img",resolve("src/assets/img"))
        .set("@scss",resolve("src/assets/common"))
        
        //生产环境的配置
        if(isProduction){
            //一般要删除预加载
            config.plugin.delete('preload')
            //开启压缩代码
            config.optimization.minimize(true)
            //分割代码
            config.optimization.splitChunks({
                chunks:'all'
            })
            //cdn

        }
    },
    configureWebpack:config => {
        if(isProduction){
            config.plugins.push(
                new uglifyJsPlugin({
                    //删除console debugger
                    compress:{
                        drop_debugger:true,
                        drop_console:true
                    },
                    sourceMap:false,
                    //使用多进程并行来提高构建速度
                    parallel:true
                })
            )
        }else{
            //测试环境

        }
    },
    //生产环境的sourceMap
    productionSourceMap:false,
    //启用并行化  默认并发数量为op.cpus.length - 1;
    parallel:require('os').cpus().length > 1,

}