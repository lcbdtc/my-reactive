// Map对象的键可以是任何类型，但WeakMap对象中的键只能是对象引用

// WeakMap不能包含无引用的对象，否则会被自动清除出集合（垃圾回收机制）。

let toProxy = new WeakMap()//根据原始的结构去查询响应后的
let toRow = new WeakMap()//根据响应后的去查询原始结构


const baseHandler = {
    get(target, key){
        const res = Reflect.get(target,key)
        //收集依赖
        track(target, key)

        //递归寻找
        return typeof res == 'object' ? reactive(res):res
    },
    set(target,key,val){
         const info = {oldValue:target[key],newValue:val}
         const res= Reflect.set(target,key,val)
         //触发更新
         trigger(target,key,info)
         return res
    }
}

function reactive(target){
    //查询缓存
    let observed = toProxy.get(target)
    if(observed){
        return observed
    }
    if(toRow.get(target)){
        return target
    }
    observed = new Proxy(target,baseHandler)

    //设置缓存
    toProxy.set(target,observed) 
    toRow.set(observed, target)

    return observed;
}

let effectStack = []//实际存储的    被reactive（）包裹的对面，会存在在effectStack中
let targetMap = new WeakMap() //做缓存的


function trigger(target,key,info){
    //触发更新

    const depsMap = targetMap.get(target) //获取依赖

    if(depsMap === undefined){
        return
    }
    const effects = new Set()
    const computedRunner = new Set()//独立管理的地方
    if(key){
        let deps = depsMap.get(key)
        deps.forEach(effect =>{
            if(effect.computed){
                computedRunner.add(effect)
            }else{
                effects.add(effect)
            }
        })
    }
    
    // const run = effect => effect()
    effects.forEach(effect => effect())
    computedRunner.forEach(effect => effect())

}


// {
//     target:{       （map）
//         name:[effect]  (set),
//         name:[effect]
//     }
// }
function track(target,key){
    let effect = effectStack[effectStack.length - 1]
    if(effect){
        //对target空初始化
        let depsMap = targetMap.get(target)
        if(depsMap === undefined){
            depsMap = new Map()
            targetMap.set(target,depsMap)
        }
        let dep = depsMap.get(key)
        if(dep===undefined){
            dep = new Set()
            depsMap.set(key,dep)
        }

        //依赖收集
        if(!dep.has(effect)){
            dep.add(effect)
            effect.deps.push(dep)
        }
    }
}


//存储effect   数据变更的时候触发函数的执行

function effect(fn,options={}){
    let e = createReactiveEffect(fn,options)  
    if(!options.lazy){
        e()
    }
    return e
}

function createReactiveEffect(fn,options){
    const effect = function effect(...args){
         return run(effect, fn, args)
    }

    effect.deps = []
    effect.computed = options.computed
    effect.lazy = options.lazy
    return effect
}

//run函数是真正执行一个effect的逻辑
function run(effect, fn, args){
    if(effectStack.indexOf(effect) === -1){
        try{
            effectStack.push(effect)            
            return fn(...args)
        }finally{
            effectStack.pop()
        }
    }
}


//computed其实是特殊的effect
function computed(fn){
    const runner = effect(fn,{computed:true,lazy:true})
    return {
        effect:runner,
        get value(){
            return runner()
        }
    }
}