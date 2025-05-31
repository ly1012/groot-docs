---
outline: deep
---


::: tip 温馨提示
Builder 的 Lazy 和非 Lazy 模式见 [Builder 模式](/guide/writing/setup#builder-模式)。

代码风格用例在非 Lazy 模式下可以使用特殊访问对象，见 [特殊访问对象](/guide/writing/setup#特殊访问对象)。
:::

## 标准写法

标准写法支持所有的断言实现类。

::: code-group 

```yml [Yaml 用例]
name: validate 标准写法
steps:
  - name: 标准写法
    noop: 1
    validate:
      - equalTo:
          check: 'abc'
          expect: 'ABC'
          ignoreCase: true
```

```java [Java 用例]
@Test
public void testJava_1() {
    noopWith("标准写法", noop -> noop
        .validate(validate -> validate
            .equalTo("abc", "ABC", params -> params.ignoreCase())));
}
```

```groovy [Groovy 用例]
@Test
public void testGroovy_1() {
    noopWith("标准写法") {
        validate {
            equalTo "abc", "ABC", { ignoreCase() }
        }
    }
}
```

:::


## 位置参数写法

位置参数写法仅适用于标准断言（StandardAssertion），三个位置参数依次为：实际值（要检验的值）、预期值、断言参数（其他属性）。

实际值类型和预期值类型未必相同，比如 `hasSize("abc", 3)`，实际值为 String 类型，预期值为 Integer 类型。

::: code-group 

```yml [Yaml 用例]
name: validate 位置参数写法
steps:
  - name: 位置参数写法
    noop: 1
    validate:
      - equalTo: ['abc', 'ABC', {ignoreCase: true}]
```

:::

Java 和 Groovy 用例写法同上面的例子，代码风格用例的写法由 Builder 提供的方法决定。

## Matcher

MatcherAssertion 抽象类用于支持 [Hamcrest](https://hamcrest.org/)，复用 Hamcrest 的断言能力。

### mapper

mapper 将原始的断言值转换为最终想要断言的值，比如类型转换、数值处理等等。

MatcherAssertion 子类都支持 mapper 特性。

对于 Yaml/Json 用例：

- mapper 字段值是一个列表，列表中的每个元素表示一个具体功能的 mapper。
- 单个 mapper
    - 单个 mapper 且 mapper 没有参数：mapper 字段的值可以是字符串。
    - 单个 mapper 有参数：必须使用列表写法。
- 多个 mapper
    - 按照顺序执行，当前的 mapper 接收上一个 mapper 的返回值（类型必须匹配）。

单个 mapper 示例。

::: code-group

```yml [Yaml 用例]
name: 单个 mapper 测试
steps:
  - name: 单个 mapper
    http:
      url: /get
      method: get
    validate:
      - header:
          headerName: Content-Type
          mapper:   # 列表写法（标准写法）
            - __internal_no_arguments_test__
          matchers:
            - equalTo: "<<<application/json>>>"
      - header:
          headerName: Content-Type
          mapper: __internal_no_arguments_test__  # 字符串写法（简写语法）
          matchers:
            - equalTo: "<<<application/json>>>"
      - header:
          headerName: Content-Type
          mapper:
            - __internal_arguments_test__:        # 有参数的 mapper
                prefix: "((("
                suffix: ")))"
          matchers:
            - equalTo: "(((application/json)))"
```

```java [Java 用例]
httpWith("单个 mapper 测试", action -> action
    .request(request -> request
        .get("/get"))
    .validate(validate -> validate
        .header("Content-Type", __INTERNAL_NO_ARGUMENTS_TEST_MAPPING,
            equalTo("<<<application/json>>>"))
        .header("Content-Type", __internal_arguments_test_mapping("(((", ")))"),
            equalTo("(((application/json)))"))
        .header("Content-Type", s -> s + "!!!",
            equalTo("application/json!!!"))));
```

```groovy [Groovy 用例]
httpWith("单个 mapper 测试") {
    request {
        get "/get"
    }
    validate {
        header "Content-Type", InternalNoArgumentsTestMapping.__INTERNAL_NO_ARGUMENTS_TEST_MAPPING,
            equalTo("<<<application/json>>>")
        header "Content-Type", __internal_arguments_test_mapping("(((", ")))"),
            equalTo("(((application/json)))")
        header "Content-Type", (s -> s + "!!!"),
            equalTo("application/json!!!")
    }
}
```

:::

`__internal_no_arguments_test__` mapper 在输入值的左右两边加上 `<<<` 和 `>>>`。

`__internal_arguments_test__` mapper 在输入值的两边加上自定义的前缀和后缀。

多个 mapper 示例。

::: code-group

```yml [Yaml 用例]
name: 多个 mapper 测试
steps:
  - name: 多个 mapper 顺序执行
    http:
      url: /get
      method: get
    validate:
      - statusCode:
          mapper:
            - string
            - __internal_arguments_test__:    # 有参 mapper
                prefix: "((("
                suffix: ")))"
            - __internal_no_arguments_test__  # 无参 mapper
          type: string
          matchers:
            - equalTo: "<<<(((200)))>>>"
```

```java [Java 用例]
httpWith("多个 mapper 测试", action -> action
    .request(request -> request
        .get("/get"))
    .validate(validate -> validate
        .statusCode(
            Function.<Integer>identity()
                .andThen(Mappings.toStr())
                .andThen(__internal_arguments_test_mapping("(((", ")))"))
                .andThen(__INTERNAL_NO_ARGUMENTS_TEST_MAPPING)
                .andThen(s -> s + "!!!"),
            equalTo("<<<(((200)))>>>!!!"))
        .statusCode(
            MappingsBuilder.<Integer, String>mappings()
                .toStr()
                .map(__internal_arguments_test_mapping("(((", ")))"))
                .map(__INTERNAL_NO_ARGUMENTS_TEST_MAPPING)
                .map(s -> s + "!!!")
                .build(),
            equalTo("<<<(((200)))>>>!!!"))));
```

```groovy [Groovy 用例]
httpWith("多个 mapper 测试") {
    request {
        get "/get"
    }
    validate {
        statusCode(
            Function.<Integer> identity()
                .andThen(Mappings.toStr())
                .andThen(__internal_arguments_test_mapping("(((", ")))"))
                .andThen(InternalNoArgumentsTestMapping.__INTERNAL_NO_ARGUMENTS_TEST_MAPPING)
                .andThen(s -> s + "!!!"),
            equalTo("<<<(((200)))>>>!!!"))
        statusCode(
            MappingsBuilder.<Integer, String> mappings()
                .toStr()
                .map(__internal_arguments_test_mapping("(((", ")))"))
                .map(InternalNoArgumentsTestMapping.__INTERNAL_NO_ARGUMENTS_TEST_MAPPING)
                .map(s -> s + "!!!")
                .build(),
            equalTo("<<<(((200)))>>>!!!"))
    }
}
```

:::


### type

有时 Matcher 参数值可能是表达式，而非字面量，表达式计算结果的类型和要检查的值的类型可能不一致。比如 Matcher 为 `equalTo("${total}")`，表达式返回 Integer 类型，要检查的值是 Long 类型，会导致断言失败。

type 用于标记 Matcher 的参数类型（上面例子中 `"${total}"` 的预期类型，即 Long 类型）。

::: danger 注意事项
如果 Matcher 参数类型是固定不变的，不需要 type 类型，比如 `ProxyMatchers.hasLength("${1 + 2}")`。
:::

**对于 Yaml/Json 用例**

Matcher 的参数类型 type 计算规则：

- 优先使用当前声明的 type
- 如果未指定 type
    - 当最后一个 mapper 为基本类型或 String 类型（即 mapper 值为 `int`/`string` 等），type 为最后一个 mapper 的值
    - 当 type 和 mapper 都未指定时，type 默认为 MatcherAssertion 实现类上 `@MatcherValueType(String.class)` 注解所表示的类型
- 当前声明的 type 会自动传递到子级，作为子级的默认 type，子级可以主动声明 type 覆盖从父级继承的 type

type 是一个字符串列表，可选值包括：

- 基本数据类型
    - `byte/java.lang.Byte` -> java.lang.Byte
    - `short/java.lang.Short` -> java.lang.Short
    - `int/java.lang.Integer` -> java.lang.Integer
    - `long/java.lang.Long` -> java.lang.Long
    - `float/java.lang.Float` -> java.lang.Float
    - `double/java.lang.Double` -> java.lang.Double
    - `boolean/java.lang.Boolean` -> java.lang.Boolean
    - `char/java.lang.Character` -> java.lang.Character
- String 类型
    - `string/java.lang.String` -> java.lang.String
- `auto` 不会进行类型自动转换，原来是什么类型就是什么类型
- 全限定类名

**对于 Java/Groovy 用例**

- 如果是一般的 Matcher：
    - 参数值类型在方法调用时便确定了，不需要 type 类型。
- 如果是 ProxyMatcher（通常包含了表达式）：
    - 如果指定了 type 类，则使用该类型。
    - 如果未指定 type 类，默认使用最终校验值（mapper 转换后的值）的类型作为 type 类。

::: code-group

```yml [Yaml 用例]
name: type 测试
steps:
  - name: type 用法
    http:
      url: /get
      method: get
    validate:
      - statusCode:
          mapper: string
          matchers:
            - equalTo: "200"
      - statusCode:
          mapper:
            - string
            - __internal_no_arguments_test__
          type: auto
          matchers:
            - equalTo: "<<<200>>>"
```

```java [Java 用例]
httpWith("type 用法", action -> action
    .request(request -> request
        .get("/get"))
    .validate(validate -> validate
        .statusCode(Mappings.toStr(),
            Matchers.hasLength(3),
            Matchers.equalTo("200"),
            ProxyMatchers.equalTo("${199 + 1}"),
            ProxyMatchers.equalTo(String.class, "${199 + 1}"))));
```

```groovy [Groovy 用例]
httpWith("多个 mapper 测试") {
    request {
        get "/get"
    }
    validate {
        statusCode Mappings.toStr(),
            Matchers.hasLength(3),
            Matchers.equalTo("200"),
            ProxyMatchers.equalTo("\${199 + 1}"),
            ProxyMatchers.equalTo(String.class, "\${199 + 1}")
    }
}
```

:::

### matchers

配置风格用例 matchers 用法。

::: code-group 

```yml [简写一]
- body: "海内存知己，天涯若比邻。"
# 等价于
- body:
    matchers:
        - equalTo: "海内存知己，天涯若比邻。"
```

```yml [简写二]
- body:
    - equalTo: "海内存知己，天涯若比邻。"
    - containsString: "天涯"
# 等价于
- body:
    matchers:
        - equalTo: "海内存知己，天涯若比邻。"
        - containsString: "天涯"
```

:::

```yml
name: matchers 测试
variables:
  bodyContent: "海内存知己，天涯若比邻。"
steps:
  - name: matchers 用法
    http:
      url: /get
      method: get
    validate:
      # 默认使用 equalTo 匹配
      - statusCode: 200
      - body: "海内存知己，天涯若比邻。"
      # 多个 Matcher
      - body:
          - equalTo: "海内存知己，天涯若比邻。"
          - containsString: "天涯"
      # allOf 全部匹配
      - body:
          - allOf:
            - equalTo: "海内存知己，天涯若比邻。"
            - containsString: "天涯"
      # anyOf 任一匹配
      - body:
          - containsString: "知己"
          - anyOf:
              - containsString: "天涯"
              - containsString: "远方"
      # 嵌套 Matcher
      - body:
          - allOf:
              - containsString: "天涯"
              - anyOf:
                  - containsString: "海"
                  - containsString: "江"
      # 使用表达式
      - body:
          - equalTo: "${bodyContent}"
      # 综合使用，type 和 mapper 与 Matcher 名称位于同一级
      - body:
          - equalTo: "${bodyContent}"
            type: string   # 将参数（表达式 ${bodyContent}）的值转为 String 类型，这里是 String -> String
```

代码风格用例的 matchers 用法。

标准 Matcher 是 Hamcrest 默认提供的 Matcher 类，比如 `Matchers.equalTo(200)`。代理 Matcher，即 ProxyMatcher 抽象类，是为了支持在 Matcher 中使用动态表达式的场景而设计的，比如 `ProxyMatchers.equalTo("${199 + 1}")`。

代码用例中使用 Matcher 推荐规范：

- 不需要动态表达式支持：直接使用标准 Matcher(可以引用已存在对象)
- 需要动态表达式支持：
    - 支持 ProxyMatcher 嵌套 ProxyMatcher(可以引用已存在对象)
    - 支持 ProxyMatcher 嵌套标准 Matcher(可以引用已存在对象)
    - 支持标准 Matcher 嵌套标准 Matcher(可以引用已存在对象)
    - **不支持标准 Matcher 嵌套 ProxyMatcher**，比如 `Matchers.allOf(ProxyMatchers.equalTo("${199 + 1}"))`

```java
httpWith("type 用法", action -> action
    .variables(variables -> variables
        .var("bodyContent", "海内存知己，天涯若比邻。"))
    .request(request -> request
        .get("/get"))
    .validate(validate -> validate
        // 默认使用 equalTo 匹配
        .statusCode(200)
        // 多个 Matcher
        .statusCode(Matchers.lessThan(300), Matchers.greaterThanOrEqualTo(200))
        // allOf 全部匹配
        .statusCode(Matchers.allOf(
            Matchers.lessThan(300),
            Matchers.greaterThanOrEqualTo(200)))
        // anyOf 任一匹配
        .statusCode(Matchers.anyOf(
            Matchers.equalTo(300),
            Matchers.equalTo(200)))
        // 嵌套 Matcher
        .body(Matchers.allOf(
            Matchers.containsString("天涯"),
            Matchers.anyOf(
                Matchers.containsString("海"),
                Matchers.containsString("江"))))
        // 如果 Matcher 或嵌套 Matcher 中包含表达式，则最外面的 Matcher 必须是 ProxyMatcher
        .body(ProxyMatchers.equalTo("${bodyContent}"))
        .body(ProxyMatchers.anyOf(
            ProxyMatchers.containsString("${'天' + '涯'}"),
            Matchers.containsString("江")))));
```
