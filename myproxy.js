// function reactive(){

// }
let obj = {name:'lcb'}
let o = new Proxy(obj,{
    get:function(target,key){
        console.log('获取值');
        return Reflect.get(target,key)
    },
    set:function(target,key,value){
        console.log('修改值',key,value);
        return Reflect.set(target,key,value)
    }
})

o.name='vue3'