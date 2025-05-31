---
outline: deep
---


测试元件与上下文链是 Groot 最核心的两个概念。

## 测试元件

测试元件是能根据其父上下文链独立执行的一个逻辑执行单元，每个测试元件都具有唯一的关键字，比如 HTTP 协议请求的关键字为 `http`，条件控制器的关键字为 `if`。我们可以先将测试元件理解为 JMeter 的 Controller/Sampler、SoapUI 或 HttpRunner 的 TestStep，不过稍微有些不同。

测试元件作为整个工具的核心，通常由 5 部分构成：基本属性、配置上下文、前置处理器、关键字属性和后置处理器。

- 基本属性：名称、描述、是否禁用等所有测试元件通用的属性。
- 配置上下文：从 HTTP 请求中抽离出 HTTP 配置是非常有必要的，比如 baseUrl、proxy、通用 header 等一些常见的配置，我们在全局配置或环境配置中设置即可，没有必要每次请求时都再写一遍。每个测试元件都可以有自己的特殊配置项，一个测试步骤可以同时拥有多个不同类型的配置上下文，比如变量配置、HTTP 配置、Extract 配置。
- 前置处理器：测试元件执行前，会执行所有的前置处理器，在这里我们可以进行一些预处理。
- 关键字属性：关键字属性由各个测试元件提供，比如 HTTP 请求的关键字为 `http`，对应的属性值为 `HttpRequest` 实例，该实例中包含了发送 Http 请求所需的信息。
- 后置处理器：后置处理器可以在测试元件执行后进行一些后处理操作。后置处理器有两个特殊的子接口：提取器接口和断言接口。

每个测试元件实例都由基本属性、配置上下文、前置处理器、关键字属性以及后置处理器构成，下面演示了测试元件的标准结构。

```yaml
name: 标准结构测试用例
steps:
  - name: 步骤名称
    config:       # 配置上下文
      variables:  # 变量配置上下文
        username: tomcat
        password: tacmot
      http:       # HttpSampler 配置上下文
        any:
          base_url: https://www.baidu.com
    setup:        # 前置处理器
      before:     # before 前置
        - hooks:  # Hooks 前置处理器
          - ${sleep(10)}
    group: "简单分组"  # 关键字属性
    teardown:     # 后置处理器
      - hooks:    # Hooks 后置处理器
          - ${do(xxx)}
          - ${print(yyy)}
      - validate$equalTo: 
          check: $.code
          expect: 200
      - extract$jsonpath:
          refName: code
          expression: $.msg
          default: 'OK'
      - hooks:
          - ${doOther(zzz)}
```

## 上下文链

每个测试元件实例都会继承其父上下文链中的配置上下文，子元件实例会覆盖父元件的同名配置。基于配置上下文的继承关系，我们就实现了配置继承与隔离。比如每个测试用例都会继承全局变量和环境变量，同时每个测试用例的用例变量又相互独立。

以变量配置上下文为例，假设现在有一个测试用例 TCA，用例结构如下：

```yml
name: TCA
variables:
  lang: java
steps:
  - name: 执行三次
    repeat: 3
    steps:
      - name: GET 请求
        variables:
          lang: python
        http:
          url: /get/${lang}
          method: GET
```

那么对于 GET 请求这个步骤来说，其上下文链表现为：

```text
全局上下文 - 环境上下文 - 用例组上下文 - 用例上下文 - Repeat 控制器上下文 - HTTP 取样器上下文
```

由于配置上下文是继承关系，所以 url 中变量 lang 的值是 `python`，而不是 `java`。

每一级上下文就是一级作用域，当前层级的上下文仅作用于当前层级及继承链上的子级。继承机制有两点好处：

- 配置隔离：当前层级定义的变量不会污染任何父级的变量，将变量声明控制在最小作用域内，防止变量数量膨胀和变量命名冲突，也方便问题排查（同级的步骤都可以定义自己的局部变量 count，用于处理内部事务，无需在用例级别上定义）
- 配置继承：针对特定用例或特定步骤使用不同的配置，比如只针对某个请求添加 HTTP 代理配置但继承其他 HTTP 配置，或是默认提取作用域为当前层级时，对某个提取器设置提取作用域为用例级别。


## 简写语法

有时我们的用例比较简单，或者我们对配置语法结构已经熟悉，我们希望尽可能省略一些明确语义的书写。

简写语法实际上是一些语法糖，最终执行前都会转换成标准结构，下面列出了一些常见的简写语法。

```yaml
# *** setup before Hooks 简写语法 ***
setupBeforeHooks:
  - ${xxx}
# 等价于
setupBefore:
  - hooks: ${xxx}
# 等价于
setup:          # 前置处理器（处理器类型）
  before:       # before 前置（前置处理器的执行时机）
    - hooks:    # Hooks 前置处理器（一个具体的处理器）
        hooks:  # Hooks 前置处理器的属性
          - ${xxx}


# *** 变量配置上下文简写语法 ***
variables:
  username: tomcat
# 等价于
config:
  variables:
    username: tomcat


# *** 提取器简写语法 ***
extract:
  - jsonpath: [code, $.data.code, { default: 200, scope: session }]
# 等价于
extract:
  - jsonpath:
      refName: code             # 变量名称
      expression: $.data.code   # 提取表达式
      default: 200              # 提取失败时的默认值
      scope: session            # 变量提取作用域，提取到 session 作用域中
# 等价于
teardown:
  - extract$jsonpath: 
      refName: code
      expression: $.data.code
      default: 200
      scope: session


# *** 断言简写语法 ***
validate:
  - equalTo: ['iii', 'III']
  # 在第三个参数中进行额外的配置
  - equalTo: ['iii', 'III', { ignoreCase: true }]
# 等价于
teardown:
  - validate$equalTo:
      check: "iii"
      expect: "III"
      ignoreCase: true
```



