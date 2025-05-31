---
outline: deep
---

提取器用于从执行结果中提取想要的数据。

::: tip 温馨提示
Builder 的 Lazy 和非 Lazy 模式见 [Builder 模式](/guide/writing/setup#builder-模式)。

代码风格用例在非 Lazy 模式下可以利用特殊访问对象 "r" 直接获取想要的数据，见 [特殊访问对象](/guide/writing/setup#特殊访问对象)。
:::


## 标准写法

标准写法支持所有的提取器实现类。

::: code-group 

```yml [Yaml 用例]
name: extract 标准写法
steps:
  - name: 标准写法
    noop: 1
    extract:
      - jsonpath:
          refName: "id"
          expression: '$.id'
          target: '{"id": "abc"}'
    validate:
      - equalTo: ['${id}', "abc"]
```

```java [Java 用例]
@Test
public void testJava_1() {
    noopWith("提取器写法", noop -> noop
        .extract(extract -> extract
            .jsonpath("id", "$.id", params -> params.target("{\"id\": \"abc\"}")))
        .validate(validate -> validate
            .equalTo("${id}", "abc")));
}
```

```groovy [Groovy 用例]
@Test
void testGroovy() {
    noopWith("提取器写法") {
        extract {
            jsonpath 'id', '$.id', { target '{"id": "abc"}' }
        }
        validate {
            equalTo '${id}', 'abc'
        }
    }
}
```

:::


## 位置参数写法

位置参数写法仅适用于标准处理器（StandardExtractor），三个位置参数依次为：变量名、表达式、提取参数（即其他属性）。

::: code-group 

```yml [Yaml 用例]
name: extract 位置参数写法
steps:
  - name: 位置参数写法
    noop: 1
    extract:
      - jsonpath: ["id", '$.id', {target: '{"id": "abc"}'} ]
    validate:
      - equalTo: ['${id}', "abc"]
```

:::

Java 和 Groovy 用例写法同上面的例子，代码风格用例的写法由 Builder 提供的方法决定。

## 提取变量、默认值和作用域

代码风格用例支持两种提取变量，配置风格用例仅支持第一种（refName）。

- `refName` 属性用于 Groot 变量机制，默认作用域为 `ALL`。
- `ref` 属性用于编程语言的变量机制（不需要提取作用域）。Ref 的使用不是线程安全的，不要共用 Ref 对象。

::: code-group

```java [Java 用例]
@Test
public void testJava_1() {
    noopWith("refName 写法", noop -> noop
        .extract(extract -> extract
            .jsonpath("id", "$.id", params -> params.target("{\"id\": \"abc\"}")))
        .validate(validate -> validate
            .equalTo("${id}", "abc")));
}

@Test
public void testJava_2() {
    Ref<String> id = ref();
    noopWith("ref 写法", noop -> noop
        .extract(extract -> extract
            .jsonpath(id, "$.id", params -> params.target("{\"id\": \"abc\"}")))
        .validate(validate -> validate
            .equalTo(id.value, "abc")));
    assert Objects.equals(id.value, "abc");
}
```

```groovy [Groovy 用例]
@Test
void testGroovy_1() {
    noopWith("refName 写法") {
        extract {
            jsonpath 'id', '$.id', { target '{"id": "abc"}' }
        }
        validate {
            equalTo '${id}', 'abc'
        }
    }
}

@Test
void testGroovy_2() {
    Ref<String> id = ref("")
    noopWith("ref 写法") {
        extract {
            jsonpath id, '$.id', { target '{"id": "abc"}' }
        }
        validate {
            equalTo id.value, 'abc'
        }
    }
    assert Objects.equals(id.value, "abc")
}
```

:::

refName 写法支持提取作用域（ExtractScope），可用的作用域为：

```java
GLOBAL("global"),            // 提取变量为全局变量
ENVIRONMENT("environment"),  // 提取变量为环境变量
TEST("test"),                // 提取变量为用例组变量
SESSION("session"),          // 提取变量为用例变量
LOCAL("local"),              // 提取变量为局部变量（当前元件所在层级）
ALL("all");   // 默认作用域，如果向上找到已存在变量，则赋值给该变量，否则退化为 LOCAL 变量
```

refName 写法提取作用域示例。

::: code-group

```yml [Yaml 用例]
name: refName 写法提取作用域测试
steps:
  - name: 提取作用域测试
    noop: 1
    extract:
      - jsonpath: ["id", '$.id', {target: '{"id": "abc"}', scope: "session"} ]
    validate:
      - equalTo: ['${sVars.id}', "abc"]
```

```java [Java 用例]
@Test
public void testJava_1_1() {
    noopWith("refName 写法", noop -> noop
        .extract(extract -> extract
            .jsonpath("id", "$.id", params -> params.target("{\"id\": \"abc\"}").scope(ExtractScope.SESSION)))
        .validate(validate -> validate
            .equalTo("${id}", "abc")));
    assert Objects.equals(sv("id"), "abc");
}
```

```groovy [Groovy 用例]
@Test
void testGroovy_1_1() {
    noopWith("refName 写法") {
        extract {
            jsonpath 'id', '$.id', { target '{"id": "abc"}' scope ExtractScope.SESSION }
        }
        validate {
            equalTo '${id}', 'abc'
        }
    }
    assert Objects.equals(sv("id"), "abc")
}
```

:::

refName 和 ref 写法都支持默认值，和 scope 类似，通过提取参数设置默认值。
