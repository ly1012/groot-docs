---
outline: deep
---

TestFilter 用于编织切面逻辑（类似 Spring 的 AOP 和 Python 中的装饰器）。


## 创建 Filter

创建一个 HTTP 请求的加解密插件。

```groovy
@KeyWord("bankServiceEncryptDecrypt")
class BankServiceEncryptDecryptFilter implements TestFilter, Unique {

    @Override
    String uniqueId() {
        return "bankServiceEncryptDecrypt"
    }

    @Override
    boolean match(ContextWrapper ctx) {
        return ctx.getTestElement() instanceof HttpSampler
    }

    @Override
    void doSample(ContextWrapper ctx, SampleFilterChain chain) {
        // 获取运行时数据
        HttpRequest request = ((HttpSampler) ctx.testElement).running.request
        request.bodyAutoComplete(ctx) // 自动补全，转为最终要发送的数据，类型为 byte[]/File/String
        // 请求加密（这里忽略了 form / multipart 类型请求 Body）
        byte[] originRequestBody
        switch (request.bodyType) {
            case JSON:    // request.json 类型为 String
                originRequestBody = ((String)request.json).getBytes(StandardCharsets.UTF_8)
                request.json = Base64.getEncoder().encodeToString(originRequestBody)
                break
            case BINARY:  // request.binary 类型为 byte[]/File
                if (request.binary instanceof File) {
                    File file = request.binary as File
                    originRequestBody = Files.readAllBytes(file.toPath())
                } else {
                    originRequestBody = request.binary as byte[]
                }
                request.binary = Base64.getEncoder().encodeToString(originRequestBody)
                break
            case DATA:    // request.data 类型为 byte[]/File/String
                if (request.data instanceof File) {
                    File file = request.data as File
                    originRequestBody = Files.readAllBytes(file.toPath())
                } else if (request.data instanceof String) {
                    String requestData = request.data
                    originRequestBody = requestData.getBytes(StandardCharsets.UTF_8)
                } else {
                    originRequestBody = request.data as byte[]
                }
                request.data = Base64.getEncoder().encodeToString(originRequestBody)
                break
        }
        // 发起请求
        chain.doSample(ctx)
        // 响应解密
        HttpSampleResult result = (HttpSampleResult) ctx.testResult
        byte[] decodedResponseBodyBytes = Base64.getDecoder().decode(result.response.body.getBytes(StandardCharsets.UTF_8))
        result.response.body = new String(decodedResponseBodyBytes, StandardCharsets.UTF_8);
    }

}
```

上面是一个简单的演示。TestFilter 还可以：

- 实现动态参数，比如声明加解密的密钥字段，从外部接收加解密的密钥。
- 根据当前元件的特征进行匹配，比如当 HTTP 请求的 serviceName 为 bankService 时才应用加解密插件。
- 重写父类的其他方法，比如 doRun/doExecute 等，在测试元件生命周期的不同时机插入切面逻辑。可以同时重写多个方法，Allure 报告集成也是通过 TestFilter 实现的。
- 实现 Ordered 接口，指定 Filter 执行时的顺序，默认值为 1000，值越小排序越靠前，取值范围为 `[Integer.MIN_VALUE, Integer.MAX_VALUE]`。
- 实现 Unique 接口，具备相同 uniqueId 的多个 TestFilter 实例，只有最近的一个会被使用。通常一个 Filter 对一个测试步骤最多只能使用一次时，会实现 Unique 接口，比如认证授权、加解密等。

动态参数示例。

```groovy
@KeyWord("bankServiceEncryptDecrypt2")
class BankServiceEncryptDecryptFilter2 extends BankServiceEncryptDecryptFilter {

    private String key = "1234567890"

    BankServiceEncryptDecryptFilter2() {
    }

    BankServiceEncryptDecryptFilter2(String key) {
        this.key = key
    }

    @Override
    public void doSample(ContextWrapper ctx, SampleFilterChain chain) {
        super.doSample(ctx, chain)
        HttpRealResponse realResponse = ctx.testResult.response as HttpRealResponse
        realResponse.headers.setHeader("encryptKey", key)
    }

    String getKey() {
        return key
    }

    void setKey(String key) {
        this.key = key
    }
}
```

## 注册 Filter

当需要根据 Filter 唯一名称反序列化为 Filter 实例时（比如全局/环境配置或 Yaml 用例），需要通过 SPI 注册该 Filter 类。此时 Filter 实现类上必须声明 `@KeyWord("bankServiceEncryptDecrypt")` 注解，bankServiceEncryptDecrypt 为该 Filter 类的唯一标识符。

```yaml
config:
  filters:
    - bankServiceEncryptDecrypt
```

在扩展模块所在项目的下列文件中添加该类的全限定类名，每个类名单独一行。

`src/main/resources/META-INF/services/com.liyunx.groot.filter.TestFilter` 文件内容：

```
com.liyunx.groot.protocol.http.filter.BankServiceEncryptDecryptFilter
com.liyunx.groot.protocol.http.filter.BankServiceEncryptDecryptFilter2
```

## 使用 Filter

任意层级都可以声明 Filter，例如全局配置、环境配置、用例配置、步骤配置。Filter 会被子级继承，如果 Filter 实现了 Unique 接口，离当前步骤最近的一个实例会被使用。

Filter 对当前步骤是否生效取决于条件是否满足，当条件满足（即 Filter 的 match 方法返回 true）时自动应用。

**Filter 的应用规则如下：** 假设全局配置到当前步骤的 TestFilter 实例（从上到下）分别为：`A U3 O1000 U1 B C O50 U2 O1100 D`，U 表示 Unique 接口实现，O 表示 Ordered 接口实现，并且 A 和 C 是不符合匹配条件 Filter。

1. 过滤不符合当前步骤的 TestFilter，结果为 `U3 O1000 U1 B O50 U2 O1100 D`。
2. 过滤 Unique Filter，结果为 `O1000 B O50 U2 O1100 D`。根据最近优先原则选择离当前步骤最近的一个 Unique Filter。
3. 根据 Ordered Filter 的优先级进行排序，结果为 `O50 O1000 B U2 D O1100`，非 Ordered Filter 默认优先级为 1000。
4. 对于当前步骤，最终按照 `O50 O1000 B U2 D O1100` 的顺序执行 Filter。

**全局 Filter**

在实例化 Groot 时，自定义 Configuration 实例，添加默认的全局 Filter。

```java
Configuration defaultConfiguration = Configuration.generateDefaultConfiguration();
List<TestFilter> builtinTestFilters = defaultConfiguration.getBuiltinTestFilters();
// 直接应用 Filter 时，Filter 类不需要先通过 SPI 注册，也不需要在类上声明 @Keyword 注解
builtinTestFilters.add(new BankServiceEncryptDecryptFilter());
Groot groot = new Groot(defaultConfiguration, "your environment name");
```

或者在 `global.yml` 或 `env-test.yml` 中配置。

**用例 Filter**

在用例级别声明的 filter，对整个用例生效，即所有子步骤都会拥有该 filter 实例。

::: code-group

```yml [Yaml 用例]
config:
  filters:
    - bankServiceEncryptDecrypt
```

```java [Java 用例]
sessionConfig(config -> config.filters(new BankServiceEncryptDecryptFilter()));
```

```groovy [Groovy 用例]
sessionConfig {
    filters new BankServiceEncryptDecryptFilter()
}
```

:::

**步骤 Filter**

也可以仅在某个步骤中使用 Filter。

::: code-group

```yml [Yaml 用例]
name: 加解密插件测试
steps:
  - name: 请求六六六
    config:
      variables:
        key: "123456"
      filters:
        - bankServiceEncryptDecrypt2:
            key: "123456"
    http:
      url: /safe/api/666
      method: POST
      data: "request data 666"
    validate:
      - equalTo: ["${r.request.body}", "cmVxdWVzdCBkYXRhIDY2Ng=="]
      - equalTo: ["${r.response.body}", "response data 666"]
      - equalTo: ["${r.response.headers.encryptKey}", "${key}"]
```

```java [Java 用例]
和 Groovy 用例类似
```

```groovy [Groovy 用例]
httpWith("加解密测试：请求一一一") {
    config {
        filters new BankServiceEncryptDecryptFilter2("123456")
    }
    request {
        post "/safe/api/111"
        body "request data 111"
    }
    validate {
        equalTo('${r.request.body}', this.base64Encode("request data 111"))
        equalTo('${r.response.body}', "response data 111")
        equalTo('${r.response.headers.encryptKey}', "123456")
    }
}
```

:::

