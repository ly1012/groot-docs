---
outline: deep
---


配置上下文由一个或多个配置项组成，用于控制元件执行时的行为，类似 SpringBoot 中的 MySql 配置、Redis 配置。

HTTP 协议元件在执行时会用到 HTTP 配置上下文，下面是一个 HTTP 配置上下文示例，Http 配置上下文由多个同类型的子配置（多个服务）组成。

```yml
http:                # HTTP 协议配置
  any:               # 对所有请求生效
    proxy:           # 设置代理，拦截请求，查看实际发送的请求和响应
      ip: 127.0.0.1
      port: 8888
  userservice:       # 对 userservice 服务的请求进行配置
    baseUrl: http://localhost:8091
    headers:
      X-Token: Z3Jvb3Q=
  orderservice:      # 对 orderservice 服务的请求进行配置
    baseUrl: http://localhost:8090
```

配置上下文有以下特点：

- 配置上下文可以出现在上下文链的各个节点。比如全局上下文（全局配置）、环境上下文（环境配置）、用例上下文（测试用例配置）、步骤上下文（具体步骤的配置，即 Controller 或 Sampler）。
- 不管配置上下文出现在哪个节点，其配置结构完全相同。
- 最近优先原则：离当前元件越近的配置，优先级越高。比如环境配置中定义了 baseUrl，用例配置中也定义了 baseUrl，则用例配置的 baseUrl 优先级更高。
- 表达式计算：
    - 变量配置上下文：立即执行，比如环境配置中定义了变量配置上下文，某个变量的值为随机函数返回值，该函数在加载环境数据时计算，所有用例引用该变量时都是同一个值。
    - 其他配置上下文：延迟执行，比如环境配置中定义了 HTTP 配置上下文，其中 headers 中包含函数，那么该函数在每次 Http 请求都会计算一次，而非加载环境数据时提前计算。

配置上下文的配置结构由各个元件定义，完整结构请移步 [参考文档](/reference/sampler/http)。

## 配置上下文写法

全局配置和环境配置中的配置写法。

::: code-group

```yml [Yaml]
http:
  any:
    baseUrl: https://httpbin.org
```

:::

用例上下文中的配置写法。

::: code-group

```yml [Yaml]
config:
  http:
    any:
      baseUrl: https://httpbin.org
```

```java [Java]
import static com.liyunx.groot.DefaultVirtualRunner.sessionConfig;

sessionConfig(config -> config
    .http(http -> http
        .anyService(any -> any
            .baseUrl("https://httpbin.org"))));
```

```groovy [Groovy]
import static com.liyunx.groot.DefaultVirtualRunner.sessionConfig;

sessionConfig {
    http {
        anyService {
            baseUrl "https://httpbin.org"
        }
    }
}
```

:::

步骤上下文中的配置写法。

::: code-group

```yml [Yaml]
name: 测试用例名称
steps:
  - name: test base url config
    config:
      http:
        any:
          baseUrl: https://httpbin.org
    http:
      url: /get
      method: GET
    validate:
      - statusCode: 200
```

```java [Java]
import static com.liyunx.groot.protocol.http.HttpVirtualRunner.httpWith

httpWith("test base url config", action -> action
    .config(config -> config
        .http(http -> http
            .anyService(any -> any
                .baseUrl("https://httpbin.org"))))
    .request(request -> request
        .get("/get"))
    .validate(validate -> validate
        .statusCode(200)));
```

```groovy [Groovy]
import static com.liyunx.groot.protocol.http.HttpVirtualRunner.httpWith

httpWith("test base url config") {
    config {
        http {
            anyService {
                baseUrl("https://httpbin.org")
            }
        }
    } request {
        get "/get"
    } validate {
        statusCode 200
    }
}
```

:::
