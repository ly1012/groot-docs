---
outline: deep
---

Groot 提供了多个扩展点，可以覆盖绝大部分扩展场景。扩展组件可以独立发布（发布为独立的 Jar）。

如果你有需求无法通过扩展点实现，请在 GitHub Issues 中详细描述你的需求。

## 扩展测试元件

测试元件（TestElement 接口）开发需要先了解几个概念：

- 声明时数据：用户的输入数据，来自 Yaml 用例或 Java/Groovy 用例。声明时数据不可修改，应为只读数据，一旦修改会导致第二次执行时失去原有的输入数据。
- 运行时数据：元件运行时会拷贝声明时数据到运行时数据，运行时数据可在 TestFilter/前后置处理器 中被修改，对应元件类的 running 字段。
- 真实请求响应数据：客户端实际发送出去的请求数据和服务端实际返回的响应数据。比如对 HTTP 请求来说，OKHttpClient 在发送请求时可能会默认添加额外的 Header 信息，真实数据即代理服务器拦截到的数据。
- 无参构造器：Groot 很多功能支持 Java SPI 机制，所以通常你的实现类需要有一个无参构造器，否则会导致实例化失败。
- recover 方法：该方法在元件每次运行前执行恢复操作，将运行时数据到恢复初始状态（即声明时数据），以支持同一个元件对象的多次运行（比如 Yaml 用例的循环控制器中的 HTTP 请求）。你可能有疑问为什么元件运行时不直接使用声明时数据，因为我们支持切面逻辑，切面中需要修改运行时数据，不管如何实现，当修改时都需要至少拷贝一次，我们选择自动拷贝一次，避免用户使用时再拷贝。
- copy 方法：通常 TestElement 实现类是非线程安全的，当同一个元件对象需要在多个线程中执行时（即并发执行），需要调用该方法返回一个新的对象，以在不同的线程中使用独立的对象。

通常需要重写的方法：

- `validate` 用于测试元件执行前执行数据校验，提前发现错误。
- `recover` 每次运行前执行恢复操作。控制器一般不需要重写，因为控制器设置不应该在运行时修改，风险太大。
- `copy` 多线程运行时使用独立的对象。

元件执行失败常见原因：

- 缺失无参构造器（SPI 发现需要无参构造器）。
- 新增字段后，忘记重写 recover 和 copy 方法。
- 配置风格用例执行失败原因：
    - 类上缺少 `@KeyWord` 注解，导致 Groot 找不到 key 对应的类。
    - 新增的元件类没有通过 SPI 注册，即修改 `src/main/resources/META-INF/services` 下的文件。
    - 类成员变量的名称（`@JSONField(name = "http")`）和用例中的 key（比如写成了 `request`）不一致。

### 扩展控制器

继承 AbstractContainerController 类，该类为容器控制器抽象类，负责调度子元件，所有子元件存储在同一个字段（steps）。

某些容器类可能不是 AbstractContainerController 子类，比如增加一个 If-Else-Controller 可能包含多个子步骤集合。

方法说明：

- `execute` 控制器逻辑实现，一般调用 `executeSubSteps` 方法来执行子元件集合，调用 `withTestStepNumberLog` 方法输出带有步骤编号的当前循环次数日志。

### 扩展取样器

继承 AbstractSampler 类，该类为 Sampler 抽象类，负责具体的协议/原子能力实现。

方法说明：

- `handleRequest` 请求执行前处理。比如请求数据的表达式计算。
- `sample` 执行请求。
- `handleResponse` 请求执行后处理。

方法执行时机见 [元件生命周期](/guide/intro/architecture#生命周期)。

## 扩展前后置处理器

::: danger Important
支持代码风格用例需要：

- 实现动态 Builder，参考 [动态 Builder 特性](/guide/writing/create_project#动态-builder-特性)。

支持配置风格用例需要：

- 类上添加 `@KeyWord("hooks")`，指定类对应的前置处理器唯一名称。
- SPI 注册（`META-INF/services`）
:::

### 扩展前置处理器

继承 AbstractProcessor 类，实现 PreProcessor 接口，即 `extends AbstractProcessor implements PreProcessor`。

AbstractProcessor 类中包含以下字段，子类中需要避免声明同名的字段。

```java
protected boolean disabled;    // 是否禁用
protected String name;         // 处理器名称
protected String description;  // 处理器描述，描述处理器的动作内容
```

通常需要重写的方法：

- `validate` 用于测试执行前执行数据校验，提前发现错误。
- `process` 处理器逻辑实现。

### 扩展后置处理器

和扩展前置处理器类似，但实现 PostProcessor 接口，即 `extends AbstractProcessor implements PostProcessor`。


### 扩展提取器

继承 AbstractExtractor 类。

需要重写的方法：

- `extract` 提取逻辑实现。

#### 标准提取器

继承 StandardExtractor 抽象类。标准提取器支持位置参数写法（配置风格用例），列表元素依次为：变量名、表达式、提取参数。

需要重写的方法：

- `extract` 提取逻辑实现。


### 扩展断言

继承 AbstractAssertion 类。

需要重写的方法：

- `process` 断言逻辑实现。

#### 标准断言

继承 `StandardAssertion<ACTUAL, EXPECTED>` 类。标准断言支持位置参数写法（配置风格用例），列表元素依次为：实际值（要检验的值）、预期值、断言参数。

实际值类型 ACTUAL 和预期值类型 EXPECTED 未必相同，比如 `hasSize("abc", 3)`，实际值为 String 类型，预期值为 Integer 类型。

需要重写的方法：

- `process` 断言逻辑实现。

#### Matcher 断言

继承 `MatcherAssertion<T>` 类。基于值的断言（值类型确定，断言类型不确定，断言类型如相等断言、数值比较、包含、正则等等）。

T 表示值的类型。

需要重写的方法：

- `extractInitialValueOfActual` 返回值为要断言的值，类型为 T。



## 扩展 Filter

实现 TestFilter 接口，可选实现 Ordered 或 Unique 接口。

支持配置风格用例或在全局/环境配置中使用需要：

- 通过 SPI 注册 TestFilter 实现类。
- TestFilter 实现类上添加 `@Keyword` 注解，指定该 Filter 的唯一名称。


### AllureFilter

和 Allure 集成需要实现 AllureFilter 接口（`AllureFilter extends TestFilter, Ordered, Unique`），该接口提供了一些和 Allure 相关的辅助方法。

AllureFilter 实现类不需要在类上添加 `@Keyword` 注解，但仍需通过 SPI 注册（`META-INF/services/com.liyunx.groot.filter.allure.AllureFilter`）。


## 扩展模板引擎

1. 创建一个新的模板引擎：实现 TemplateEngine 接口。
2. 在 Groot 实例化时传入自定义配置，自定义配置中使用新的模板引擎。

```java
Configuration defaultConfiguration = Configuration.generateDefaultConfiguration();
defaultConfiguration.setTemplateEngine(new CustomTemplateEngine());
Groot groot = new Groot(defaultConfiguration, "your environment name");
```


## 扩展函数

1. 创建一个新的函数类：继承 AbstractFunction 抽象类或实现 Function 接口。
2. 通过 SPI 注册该函数类。


## 扩展 Mapping

创建一个新的 Mapping 类：实现 `MappingFunction<T, R>` 接口。T 表示输入值类型，R 表示输出值类型。

支持配置风格用例还需要：

1. 实现类上添加 `@KeyWord("int")` 注解，int 表示 Mapping 的唯一名称。
2. 通过 SPI 注册该 Mapping 类。

支持代码风格用例还需要：

1. 通过子类扩展 Mappings 类或 MappingBuilder 类。
2. 或者不扩展，在使用时手动传入，即：

```java
Function.<Integer> identity()
    // 使用内置的静态方法得到实例对象
    .andThen(Mappings.toStr())
    // 有参 Mapping，调用静态方法得到实例对象
    .andThen(__internal_arguments_test_mapping("(((", ")))"))
    // 无参 Mapping，通过静态变量得到实例对象
    .andThen(InternalNoArgumentsTestMapping.__INTERNAL_NO_ARGUMENTS_TEST_MAPPING)
    // 自定义代码
    .andThen(s -> s + "!!!")

MappingsBuilder.<Integer, String> mappings()
    // 内置方法
    .toStr()
    // 有参，调用静态方法
    .map(__internal_arguments_test_mapping("(((", ")))"))
    // 无参，使用静态变量
    .map(InternalNoArgumentsTestMapping.__INTERNAL_NO_ARGUMENTS_TEST_MAPPING)
    // 自定义代码
    .map(s -> s + "!!!")
    .build()
```


## 扩展 Matcher

创建一个新的标准 Matcher 类，以及与之对应的 ProxyMatcher 类或提供生成该标准 Matcher 代理类的方法。

支持配置风格用例还需要：

- 提供一个 FastJson2Interceptor 实现类（通常是继承 AbstractFastJson2Interceptor 抽象类），实现 `deserializeMatcher` 方法，完成 key 到 Matcher 的映射。
- 通过 SPI 注册该实现类。

支持代码风格用例还需要：

1. 通过子类扩展 Matchers 类或 ProxyMatchers 类。
2. 或者不扩展，在使用时手动传入，即：

```java
body(
    // 使用内置方法
    Matchers.containsString("天涯"),
    ProxyMatchers.containsString("${'天' + '涯'}"),
    // 实例化或方法调用
    new MyCustomMatcher("param1", 3),
    MyCustomMatcher.cus("param1", 3)
)
```

## 扩展数据加载器

1. 继承 AbstractDataLoader 抽象类，重写 next 和 nextByID 方法。如果一个 DataLoader 实现类无法处理请求，方法应当返回 null，表示自己无法处理该请求。
2. 在 Groot 实例化时传入自定义配置，自定义配置中设置 DataLoader。

```java
Configuration configuration = Configuration.generateDefaultConfiguration();
configuration.setDataLoader(firstFileDataLoader);
Groot groot = new Groot(configuration, "your environment name");
```

DataLoader 接口使用责任链模式，通过 `setNext` 方法设置下一个 DataLoader 实例。

### LocalDataLoader

LocalDataLoader（`LocalDataLoader extends AbstractDataLoader`） 表示从本地文件加载数据。

扩展 LocalDataLoader 的步骤：

1. 创建一个实现类，继承 LocalDataLoader 抽象类。
2. 通过 SPI 注册该类。

::: info 温馨提示
实现一套全新的 DataLoader，比如基于数据库或远程地址加载数据，所有已有的 DataLoader 都需要重新实现。

举个例子：开发一个测试平台，实现一个新的抽象类 PlatformDataLoader，并提供已有 LocalDataLoader（比如 HttpSamplerFileDataLoader、ParametersDataFileLoader、TestCaseFileLoader 等等）的对应实现，此时 identifier 可能分别表示平台中存储的接口模板 ID、文件存储 ID/地址、用例 ID。
:::


## 扩展全局与环境配置加载器

在 Groot 实例化时传入自定义配置，自定义配置中设置，例如：

```java
Configuration configuration = Configuration.defaultConfiguration();
configuration.setGlobalConfigLoader(() -> {
    GlobalConfig globalConfig = new GlobalConfig();
    globalConfig.put(VariableConfigItem.KEY, new VariableConfigItem.Builder()
        .var("k1", "k1_gValue")
        .var("k2", "k2_gValue")
        .build());
    return globalConfig;
});
configuration.setEnvironmentLoader(environmentName -> {
    EnvironmentConfig environmentConfig = new EnvironmentConfig();
    environmentConfig.put(VariableConfigItem.KEY, new VariableConfigItem.Builder()
        .var("k2", "k2_eValue")
        .var("k3", "k3_eValue")
        .build());
    return environmentConfig;
});
groot = new Groot(configuration, "test");
```

也可以不使用 Lambda 表达式，先定义一个 GlobalConfigLoader 接口实现类和 EnvironmentConfigLoader 接口实现类。

## 扩展 Yaml 用例语法

继承 AbstractFastJson2Interceptor 抽象类。本扩展点用于扩展 Yaml 简写语法，增加简写语法糖。

扩展 FastJson2Interceptor 的步骤：

1. 创建一个实现类，继承 AbstractFastJson2Interceptor 抽象类。
2. 通过 SPI 注册该类。

案例参考：BuiltinFastJson2Interceptor、HttpSamplerFastJson2Interceptor。


