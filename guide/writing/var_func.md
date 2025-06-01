---
outline: deep
---

## 变量

变量当前有 5 种级别：全局变量、环境变量、用例组变量、用例变量和局部变量。

全局配置中的变量为全局变量，环境配置中的变量为环境变量，TestRunner 层级的变量为用例组变量，SessionRunner 层级的变量为用例变量，用例子元件的变量都是局部变量。其中全局变量和环境变量是线程共享的，即在多个用例中共享；用例变量和局部变量仅限当前测试用例中可用。

变量作用域本质上就是配置上下文的作用域，每级测试元件的变量仅限当前测试元件与其子元件中可用，这一点和代码类似，测试元件的变量相当于变量声明 + 赋值。每级变量都会覆盖其父级变量中的同名变量，即变量访问遵循最近优先原则。

Groot 内置变量访问对象：

- 全局变量 `gVars`
- 环境变量 `eVars`
- 用例组变量 `tVars`
- 用例变量 `sVars`
- 当前层级变量 `lVars`
- 所有变量 `vars`，vars 访问和直接访问一个变量都遵循最近优先原则

通过 gVars/eVars/tVars/sVars/lVars 直接访问或修改指定层级的变量，通过 vars 访问或修改最近的变量。

:::code-group 

```yaml [配置风格用例]
# === 访问变量 ===
# 直接访问某个变量，等价于 vars.v4
${print(v4)}
# 通过内置的变量访问对象访问某个变量
${print(gVars.v1, eVars.v2, sVars.v3, vars.v4)}
# 通过变量对象的 get 方法访问
${sVars.get('v4')}
# 嵌套访问
${k6.children[0]}
# 非英文变量名
${vars['地址']['中国']['浙江']}

# === 更新变量（调用 put 方法） ===
${vars.put('myk1', 'new myk1')}

# === 删除变量（调用 remove 方法） ===
${vars.remove('name')}
```

```java [代码风格用例]
import static com.liyunx.groot.DefaultVirtualRunner.*;

sv("total");       // 访问变量
sv("total", 10);   // 更新变量
rmsv("total");     // 删除变量

// 其他方法名类似：
// gv - 全局变量，Global
// ev - 环境变量，Environment
// tv - 用例组变量，TestRunner
// sv - 用例变量，SessionRunner
// lv - 局部变量，Local
// v  - 所有变量，Vars
```

:::

::: tip 温馨提示
对于代码风格用例，优先使用编程语言自身的变量机制，仅在需要时使用 Groot 提供的变量机制。
:::

### Ref

`com.liyunx.groot.support.Ref` 类是 Groot 针对 Lambda 表达式提供的一个包装类。

### 变量作用域管理

随意使用 Groot 提供的变量机制，会导致用例难以维护，不方便排查问题。

- 推荐最小作用域原则，能在更小范围内使用的变量，不将变量作用域提升到更大的范围。
    - 推荐使用局部变量，比如一个 HTTP 请求步骤内部使用的变量，先在当前步骤的配置中进行变量声明，或显式设置提取作用域为 LOCAL。
- 如果代码测试用例采用分层设计，即普遍的 API、Service、TestCase 三层：
    - 尽量在方法内部管理这些 Groot 变量，避免变量外溢
    - 尽量避免使用 Groot 提供的变量机制在不同层级间传递数据（全局变量和环境变量除外）
    - 不同层级间的数据传递，尽量使用方法参数等 IDE 友好的方案


## 函数

变量是静态的数据，在不修改变量的前提下，多次访问变量得到的值完全相同。

函数可以动态生成所需数据，或完成特定操作。

### 实现函数

实现一个自定义函数有两种方式：

- 实现 `com.liyunx.groot.functions.Function` 接口。
- 继承 `com.liyunx.groot.functions.AbstractFunction` 抽象类。

下面是一个内置函数的代码示例。

```java
/**
 * 等待函数，单位为毫秒
 * <p>示例：</p>
 * <ul>
 *     <li>${sleep(100)}</li>
 * </ul>
 * <p>函数参数：</p>
 * <ul>
 *     <li>等待时间，单位 ms</li>
 * </ul>
 */
public class SleepFunction extends AbstractFunction {

    @Override
    public String getName() {
        return "sleep";
    }

    @Override
    public String execute(ContextWrapper contextWrapper, List<Object> parameters) {
        checkParametersCount(parameters, 1);
        String timeInMillisAsString = String.valueOf(parameters.get(0));
        sleep(Long.parseLong(timeInMillisAsString));
        return timeInMillisAsString;
    }

    /* ------------------------------------------------------------ */
    // 直接调用，不需要实例化

    /**
     * 等待一段时间
     *
     * @param timeInMills 等待时间，单位 ms
     */
    public static void sleep(long timeInMills) {
        try {
            Thread.sleep(timeInMills);
        } catch (InterruptedException e) {
            throw new GrootException("等待函数执行失败", e);
        }
    }

}
```

### 注册函数

**通过 SPI 机制注册：** 在扩展模块所在项目的下列文件中添加一行，内容为自定义函数类的全限定类名。

`src/main/resources/META-INF/services/com.liyunx.groot.functions.Function` 文件内容：

```
com.liyunx.groot.functions.SleepFunction
```

**通过 API 注册：**

```java
List<Function> functions = ApplicationConfig.getFunctions();

// 线程不安全的注册方式
functions.add(new SleepFunctions());

// 线程安全的注册方式
List<Function> newFunctions = new ArrayList<>(functions);
newFunctions.add(new SleepFunctions());
ApplicationConfig.setFunctions(newFunctions);
```

### 使用函数

groot-functions 模块提供了一些内置函数。

- 配置风格用例：通常在表达式中使用函数。
- 代码风格用例：直接调用函数类提供的静态方法（如果有），或者在表达式中使用函数。


## 表达式

使用 `${}` 访问变量或调用函数。

Groot 默认使用 [FreeMarker](https://freemarker.apache.org/index.html) 模板引擎进行表达式解析和计算。你可以替换为自己实现的模板引擎（比如定制化一些需求），但仍需遵循 `${}` 的表达式形式。

- `${xxx}` 被称为表达式，比如 `${username}`。
- `xxx ${xxx} xxx` 被称为模板字符串，简称模板，比如 `name is ${username}`。

```yaml
# 基本属性 name 和 description 都支持模板字符串
name: name is ${username}
```

::: tip 温馨提示
Yaml 中 {} 为对象表示，<span v-pre>{{ }}</span> 的表达式形式与 Yaml 语法冲突，必须使用引号包裹，会让用例编写稍显繁琐，故不采纳。
:::

### FreeMarker

Groot 默认使用 FreeMaker 模板引擎解析表达式，下面列举了一些常见操作。

```yml
# 返回变量 total 的整数类型值，FreeMarker 默认所有数字都是 BigDecimal 进行计算
${total?int}

# 将字符串当做普通字符串，不计算
${print('管理员 ${username} 登录后台')}   -> 管理员 admin 登录后台
${print(r'管理员 ${username} 登录后台')}  -> 管理员 ${username} 登录后台

# 算术运算
${2 * 3}

# 比较运算
${total < 2}
${role == 'admin'}

# 逻辑运算符
${role == 'guest' && username == 'tom'}

# 函数嵌套调用
${vars.put('x', vars.get('x') + 1)}

# 变量嵌套访问
${person.name}
${vars['地址']['中国']['浙江']}
```



