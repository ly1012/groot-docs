---
outline: deep
---

前置处理器接口 PreProcessor 和后置处理器接口 PostProcessor 都继承自处理器接口 Processor。

## 前置处理器执行时机

请结合 [元件生命周期](/guide/intro/architecture#生命周期) 阅读本小节。

setupBefore 和 setupAfter 都是前置处理。它们的区别在于：

| | <div style="width:120px;">适用元件</div> | 特点 |
| -- | -- | -- |
| `setupBefore` | 所有元件 | 此时关键字属性的值还未计算，仍然是声明时数据，比如 HTTP url 还是模板字符串。 |
| `setupAfter` | 仅 Sampler 元件 | 此时关键字属性的值已计算，比如变量被替换、函数被调用。 |

如果要进行加密前置处理，就不能使用 setupBefore，此时关键字属性未计算（Body 内容中还存在表达式）。使用 setupAfter 则没有这个问题，此时 Body 中表达式已完成计算，Body 是最终的明文请求数据（未加密）。

::: tip 温馨提示
虽然可以使用前后置完成加解密这类操作，但更推荐使用 TestFilter 以切面编程的方式来完成此类通用任务。
:::


## 前置处理器写法


::: tip 温馨提示
Hooks 前置处理器和 Hooks 后置处理器有更多简写语法，参考 [Hooks 前置处理器](/reference/processor/hooks)。
:::

前置处理器标准写法示例，也是推荐的一种写法。

setupBefore 和 setupAfter 最多只能出现一次，如果多次调用，最后一个 setupBefore 和 setupAfter 生效（后声明/后调用的生效）。

::: code-group

```yml [Yaml 用例]
name: Hooks 前后置处理器
variables:
  x: 0
  y: 0
steps:
  - name: 标准写法测试
    noop: 1
    setupBefore:
      - hooks:
          - ${vars.put('x', x + 1)}
          - ${vars.put('y', y + 1)}
    setupAfter:
      - hooks:
          - ${vars.put('x', x + 1)}
          - ${vars.put('y', y + 1)}
    validate:
      - equalTo: ["${(x + y)?int}", 4]
```

```java [Java 用例]
import static com.liyunx.groot.DefaultVirtualRunner.noopWith

sv("x", 0);
sv("y", 0);
noopWith("前置处理器标准写法测试", noop -> noop
    .setupBefore(setup -> setup
        .hooks(hooks -> hooks
            .hook("${vars.put('x', x + 1)}")
            .hook("${vars.put('y', y + 1)}")))
    .setupAfter(setup -> setup
        .hooks(hooks -> hooks
            .hook("${vars.put('x', x + 1)}")
            .hook("${vars.put('y', y + 1)}")))
    .validate(validate -> validate
        .equalTo("${(x + y)?int}", 4)));
```

```groovy [Groovy 用例]
import static com.liyunx.groot.DefaultVirtualRunner.noopWith

sv("x", 0)
sv("y", 0)
noopWith("前置处理器标准写法测试") {
    setupBefore {
        hooks {
            // Groovy 中 "" 为插值字符串，$ 引用的是代码中的变量，
            // 而这里的 $ 是 Groot 的表达式写法，因此 $ 需要转义，或者使用 ''
            hook("\${vars.put('x', x + 1)}")
            hook("\${vars.put('y', y + 1)}")
        }
    }
    setupAfter {
        hooks {
            hook("\${vars.put('x', x + 1)}")
            hook("\${vars.put('y', y + 1)}")
        }
    }
    validate {
        equalTo("\${(x + y)?int}", 4)
    }
}
```

:::

before 和 after 合并写法示例，仅推荐在同时需要 before 和 after 时使用该写法。

- setup.before 和 setupBefore 等价，setup.after 和 setupAfter 等价。
- setup.before 和 setup.after 最多只能出现一次，如果出现多次最后一个生效。
- setup.before 和 setupBefore 同时出现时，也是最后一个生效。setup.after 同理。

::: code-group

```yml [Yaml 用例]
name: Hooks 前后置处理器
variables:
  x: 0
  y: 0
steps:
  - name: 合并写法测试
    noop: 1
    setup:
      before:
        - hooks:
            - ${vars.put('x', x + 1)}
            - ${vars.put('y', y + 1)}
      after:
        - hooks:
            - ${vars.put('x', x + 1)}
            - ${vars.put('y', y + 1)}
    validate:
      - equalTo: ["${(x + y)?int}", 4]
```

```java [Java 用例]
import static com.liyunx.groot.DefaultVirtualRunner.noopWith

sv("x", 0);
sv("y", 0);
noopWith("前置处理器合并写法测试", noop -> noop
    .setup(setup -> setup
        .before(before -> before
            .hooks(hooks -> hooks
                .hook("${vars.put('x', x + 1)}")
                .hook("${vars.put('y', y + 1)}")))
        .after(after -> after
            .hooks(hooks -> hooks
                .hook("${vars.put('x', x + 1)}")
                .hook("${vars.put('y', y + 1)}"))))
    .validate(validate -> validate
        .equalTo("${(x + y)?int}", 4)));
```

```groovy [Groovy 用例]
import static com.liyunx.groot.DefaultVirtualRunner.noopWith

sv("x", 0)
sv("y", 0)
noopWith("前置处理器合并写法测试") {
    setup {
        before {
            hooks {
                hook("\${vars.put('x', x + 1)}")
                hook("\${vars.put('y', y + 1)}")
            }
        }
        after {
            hooks {
                hook("\${vars.put('x', x + 1)}")
                hook("\${vars.put('y', y + 1)}")
            }
        }
    }
    validate {
        equalTo("\${(x + y)?int}", 4)
    }
}
```

:::

Groovy 用例中 `setup { before {} after {} }` 合并写法可以正常编译执行，但是 before 和 after 闭包中调用委托对象的方法时 Intellij IDEA 中无法自动补全和进行方法跳转。推荐使用 `setup(Closure, Closure)` 或直接使用 `setupBefore(Closure)` 和 `setupAfter(Closure)` 代替。

```groovy
sv("x", 0)
sv("y", 0)
noopWith("前置处理器合并写法测试") {
    // setup(Closure, Closure)
    // 第一个闭包等价于 setupBefore，第二个闭包等价于 setupAfter
    setup {
        hooks {
            hook("\${vars.put('x', x + 1)}")
            hook("\${vars.put('y', y + 1)}")
        }
    } {
        hooks {
            hook("\${vars.put('x', x + 1)}")
            hook("\${vars.put('y', y + 1)}")
        }
    }
    validate {
        equalTo("\${(x + y)?int}", 4)
    }
}
```

::: details 无法自动补全的原因
当内部类在 `@DelegatesTo` 中使用外部类中定义的泛型时，Intellij IDEA 无法识别该泛型，即无法识别委托对象类型，故无法给出方法提示和自动补全(属于 IDE 功能)，但执行正常(正常编译执行)。 
:::

## Builder 模式

Java/Groovy 用例通过 Builder 来构建测试元件对象。配置风格用例（Yaml/Json）通过 JSON 反序列化构建测试元件对象，不依赖 Builder。

Builder 建造者模式，方法调用时逐步构建完整的目标对象，获取到完整的对象后再使用该对象。

### Lazy 模式

Lazy 模式，方法调用时方法所代表的行为并未发生，仅仅只是一个收集动作。

比如下面的例子，lazyExtract 方法接受的闭包代码中，jsonpath 提取器并未立即执行，只是简单的收集到一个提取器列表中。

```groovy
Closure params =   {
    target '{"person":{"name":"jack","age":18}}'
}

Ref<String> personName = ref("")
groupWith("简单的分组") {
    lazyExtract {
        jsonpath 'personName', '$.person.name', this.params
        assert lv('personName') == null   // 此时提取操作还未执行

        jsonpath personName, '$.person.name', this.params
        assert personName.value == ""     // 此时提取操作还未执行
    }
    lazyValidate {
        def expected = "jack"
        equalTo('${personName}', expected)
        equalTo(personName.value, "")     // 此时 lazyExtract 还未执行
    }
}
```

### 非 Lazy 模式

虽然 Lazy 模式可以完成任务，但这种模式更适合配置风格用例，用在代码风格用例上显得有些水土不服。比如上面例子中，personName.value 的值为空（即我们一开始定义的默认值），也就是说，我们只能使用 Groot 的变量机制和一些辅助对象构建的代码，不能充分发挥编程语言的灵活性优势，让我们的代码风格用例看起来只是配置风格用例的模仿和简单增强。

非 Lazy 模式，方法调用时方法所代表的行为会立即发生，即实际执行。下面的例子更符合我们日常的编程习惯。

**非 Lazy 模式是代码风格用例的推荐使用模式**，如果你想尽量和配置风格用例保持一致，可以使用上面提到的 Lazy 模式。

```groovy
Closure params =   {
    target '{"person":{"name":"jack","age":18}}'
}

Ref<String> personName = ref("")
groupWith("简单的分组") {
    extract {
        jsonpath 'personName', '$.person.name', this.params
        assert lv('personName') == "jack"

        jsonpath personName, '$.person.name', this.params
        assert personName.value == "jack"
    }
    validate {
        def expected = "jack"
        equalTo('${personName}', expected)
        equalTo(personName.value, expected)
    }
}
```

::: danger 注意事项
如果你对这两种模式理解的不够深入（看懂源码），强烈建议不要在同一个元件对象上混合使用 Lazy 和非 Lazy 模式，比如：

- `lazyTeardown { extract {} validate {} }` 
- `teardown { lazyExtract {} lazyValidate {} }`

了解更多示例请查看 groot-core 下的单测用例：

- `src/test/groovy/com/liyunx/groot/builder/LazyBuilderGroovyTest.groovy`
:::

## 特殊访问对象

代码风格用例在非 Lazy 模式下，支持使用特殊访问对象 e 和 r。

- `e` 用于修改请求发送前的数据。运行时 TestElement 对象（注意不是声明时 TestElement 对象），声明时对象不可修改，运行时对象可修改。
- `r` 用于访问实际请求和响应数据。TestResult 对象。

::: code-group 

```java [Java 用例]
@Test
public void testSpecialAccessObjects() {
    String url = "/get";

    WireMock.stubFor(WireMock
        .get(WireMock
            .urlEqualTo(url)));

    httpWith("Get 请求", http -> http
        .request(request -> request
            .get(url)
            .header("token", "gua gua"))
        .setupAfter(setup -> {
            setup.e.getRequest().getHeaders().setHeader("traceId", "traceId123");
        })
        .teardown(teardown -> {
            assert teardown.r.getRequest().getHeaders().getHeader("traceId").getValue() == "traceId123";
            teardown.extract(extract -> {
                assert extract.r.getRequest().getHeaders().getHeader("token").getValue() == "gua gua";
            }).validate(validate -> {
                assert validate.r.getRequest().getMethod() == "GET";
            });
        }));
}
```

```groovy [Groovy 用例]
@Test
public void testSpecialAccessObjects() {
    String url = "/get"

    WireMock.stubFor(WireMock
        .get(WireMock
            .urlEqualTo(url)))

    httpWith("Get 请求") {
        request {
            get url
            header "token", "gua gua"
        }
        setupAfter {
            e.request.headers.setHeader "traceId", "traceId123"
        }
        teardown {
            assert r.request.headers.getHeader("traceId").value == "traceId123"
            extract {
                assert r.request.headers.getHeader("token").value == "gua gua"
            }
            validate {
                assert r.request.method == "GET"
            }
        }
    }
}
```

:::

## 执行结果收集

执行结果收集是将每个处理器的执行结果收到一个执行结果列表中，用户可以持久化该结果列表，或者是在报告中展示。

执行结果收集的功能，目前已有大致的设计和实现，但仍然不够完善，**后续可能会继续改造，变更类和 API，目前尽量不要使用**。


