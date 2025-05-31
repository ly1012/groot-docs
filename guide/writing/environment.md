---
outline: deep
---


有时我们的自动化用例需要在多个环境中运行，比如测试环境、联调环境、线上环境等等，但用例的逻辑是一样的，此时，我们就需要将自动化用例中与环境相关的数据和配置单独拿出来，每套环境一份环境配置，在运行时指定环境。

环境管理指的是创建环境和指定环境运行。

## 创建环境

我们以 Groot 的默认行为来演示如何创建环境，Groot 默认从指定文件加载环境配置。

假设现在我们有 3 个环境需要测试，分别为 local、test、dev。先在 `src/test/resources` 目录下创建 3 个对应的环境配置文件 `env-local.yml`、`env-test.yml`、`env-dev.yml`。

每个环境配置文件的配置结构（配置项）完全相同，配置结构由具体的配置类决定。以 HTTP 协议为例，HTTP 协议的配置由 HttpConfigItem 类决定，下面是一个具体的示例 `env-local.yml`：

```yml
http:                # HTTP 协议配置
  any:               # 对所有请求生效
    proxy:           # 设置代理，拦截请求，查看实际发送的请求和响应
      ip: 127.0.0.1
      port: 8888
  userservice:       # 对 userservice 服务的请求进行配置
    baseUrl: http://localhost:8091
  orderservice:      # 对 orderservice 服务的请求进行配置
    baseUrl: http://localhost:8090
```

在 test 环境进行回归测试时，不需要设置代理，所以 `env-test.yml` 中去掉代理配置：

```yml
http:                # HTTP 协议配置
  userservice:       # 对 userservice 服务的请求进行配置
    baseUrl: http://192.168.1.14:8091
  orderservice:      # 对 orderservice 服务的请求进行配置
    baseUrl: http://192.168.1.15:8090
```

除了使用默认的加载器加载数据，你也可以指定自己的环境配置加载实现。

```java
Configuration configuration = Configuration.defaultConfiguration();
// 使用自己的环境配置加载实现（默认从本地文件加载）
// 比如从数据库、远程文件或其他位置加载，或者直接动态创建本次需要的环境配置
configuration.setEnvironmentLoader(environmentName -> {
    EnvironmentConfig environmentConfig = new EnvironmentConfig();
    environmentConfig.put(VariableConfigItem.KEY, new VariableConfigItem.Builder()
        .var("k2", "k2_eValue")
        .var("k3", "k3_eValue")
        .build());
    return environmentConfig;
});
// 指定 test 环境运行
Groot groot = new Groot(configuration, "test");
```

## 指定环境运行

在应用配置文件 `groot-test.yml` 中指定要运行的环境名称：

```yml
environment:
  active: test
```

或者在命令行中通过系统属性 `-Dgroot.environment.active=<environmentName>` 指定。 

我们也可以在实例化 Groot 对象时指定要运行的环境名称。

```java
// 指定 test 环境运行
Groot groot = new Groot("test");
```

读取优先级（优先级低的在前）：

- 应用配置文件，例如 `groot-test.yml`
- 命令行参数 `-Dgroot.environment.active=<environmentName>`
- Groot 实例化时指定

