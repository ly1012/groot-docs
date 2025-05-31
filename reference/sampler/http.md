---
outline: deep
---

## HTTP 配置上下文

### 多个服务配置

HTTP 配置上下文由一个或多个子配置上下文组成，如下所示，`any` 表示对所有服务生效，`userservice` 表示只对服务名称为 userservice 的服务生效。

::: code-group

```yaml [Yaml 用例]
http:
  any:
    headers:
      x-auth-token: need-token
    proxy:
      ip: 127.0.0.1
      port: 8888
  userservice:
    baseUrl: https://login.product.com
  orderservice:
    baseUrl: https://order.product.com
```

```java [Java 用例]
.http(http -> http
    .anyService(any -> any
        .header("x-auth-token", "need-token")
        .proxy("127.0.0.1", 8888))
    .service("userservice", service -> service
        .baseUrl("https://login.product.com"))
    .service("orderservice", service -> service
        .baseUrl("https://order.product.com")))
```

```groovy [Groovy 用例]
http {
    anyService {
        header "x-auth-token", "need-token"
        proxy "127.0.0.1", 8888
    }
    service "userservice", {
        baseUrl "https://login.product.com"
    }
    service "orderservice", {
        baseUrl "https://order.product.com"
    }
}
```

:::


**合并策略**

继承关系（后者继承前者）：(any > service) > (api/template > sampler)

1. 先纵向合并（上下文链的所有 HTTP 配置上下文）
    1. 上下文链的同名称 HTTP 配置合并（子级覆盖父级），any 合并 any，service 合并 service
    2. service 合并 any（如果请求指定了 service）
2. 再横向合并（合并请求引用的数据）
    1. sampler 合并 api/template
    2. sampler 合并 service（如果未指定 service 名称，则默认使用 any）


**合并后执行**

1. 如果是绝对路径，使用绝对路径
2. 如果是相对路径
    1. 如果存在 baseUrl，则使用 baseUrl
    2. 如果不存在 baseUrl，则报错

### 配置详解

::: code-group

```yaml [Yaml 用例]
# baseUrl 必须是 http 或 https 开头
baseUrl: http://localhost:9000

# 请求 Header
# 标准写法（支持多值 Header，多个同名 Header）
headers:
  - name: x-auth-token
    value: need-token
# 简写语法（不支持多值 Header）
headers:
  x-auth-token: need-token

# 正向代理服务器设置
# 标准写法
proxy:
  ip: 127.0.0.1
  port: 8888
# 简写语法
proxy: "127.0.0.1:8888"

# 是否进行 SSL 校验。自签名证书，跳过校验，设置为 false。
verify: false

# 原样发送 Body 数据，不解析表达式，比如请求 Body 为 10M 超大字符串或 JSON
raw: true
```

```java [Java 用例]
.anyService(any -> any
    .baseUrl("http://localhost:9000")
    .header("x-auth-token", "need-token")
    .proxy("127.0.0.1", 8888)
    .verify(false)
    .raw(true)
```

```groovy [Groovy 用例]
anyService {
    baseUrl "http://localhost:9000"
    header "x-auth-token", "need-token"
    proxy "127.0.0.1", 8888
    verify false
    raw true
}
```

:::



## HTTP 请求

### service

service 指定当前请求属于哪个服务（使用该服务的配置，具体见前面的配置上下文合并策略）。下面的例子中

::: code-group

```java [Mock 规则]
wireMockServer.stubFor(WireMock
    .get("/user/info")
    .willReturn(WireMock.ok()
        .withHeader("ServiceName", "{{request.headers.ServiceName}}")
        .withTransformers("response-template")));
```

```yaml [Yaml 用例]
name: 指定服务
config:
  http:
    any:
      headers:
        ServiceName: "anyService"
    userService:
      headers:
        ServiceName: "userService"
steps:
  - name: 获取用户信息
    http:
      url: /user/info
      method: GET
      service: userService
    validate:
      - statusCode: 200
      - header:
          headerName: ServiceName
          matchers:
            - equalTo: "userService"
```

```java [Java 用例]
sessionConfig(config -> config
    .http(http -> http
        .anyService(any -> any
            .header("ServiceName", "anyService"))
        .service("userService", service -> service
            .header("ServiceName", "userService"))));
httpWith("指定 Service 测试", action -> action
    .request(request -> request
        .get("/user/info")
        .withService("userService"))
    .validate(validate -> validate
        .statusCode(200)
        .header("ServiceName", "userService")));
```

```groovy [Groovy 用例]
类似 Java 用例
```

:::

### method

支持常见的 Method：GET、POST、PUT、DELETE、PATCH、HEAD、OPTIONS、TRACE、CONNECT。默认使用 OKHttp 库发送请求，理论上 OKHttp 支持的请求方法都可以。

method 名称不区分大小写，最终请求前会统一转为大写。

::: code-group

```yaml [Yaml 用例]
http:
  method: GET
```

```java [Java 用例]
http("get", request -> request.get("/get"));
http("get", request -> request.method("GET").url("/get"));
```

```groovy [Groovy 用例]
http("get")  {
    get("/get")
}
http("get") {
    method("GET")
    url("/get")
}
```

:::

### url

::: code-group

```yaml [Yaml 用例]
# 设置 baseUrl，url 使用相对路径
http:
  baseUrl: http://localhost:${httpPort}/get
  url: /123

# url 使用绝对路径
http:
  url: http://localhost:${httpPort}/get/123
```

```java [Java 用例]
// 绝对路径
.request(request -> request
    .get("http://localhost:${httpPort}/get/123"))

// 相对路径
.request(request -> request
    .baseUrl("http://localhost:${httpPort}/get")
    .get("/123"))
```

```groovy [Groovy 用例]
// 绝对路径
request {
    get "http://localhost:\${httpPort}/get/123"
}

// 相对路径
request {
    baseUrl "http://localhost:\${httpPort}/get"
    get "/123"
}
```

:::

### 路径变量

::: code-group

```yaml [Yaml 用例]
name: "Request URL 路径变量测试用例"
steps:
  - name: 路径变量测试
    # 配置上下文变量(作用域为当前步骤及其子步骤，语法为 ${name})
    variables:
      method: get
    http:
      url: /${method}/:id/detail
      method: GET
      # 路径变量(作用域为 URL，语法为 :name)，注意和配置变量区分
      variables:
        id: 123
```

```java [Java 用例]
httpWith("路径变量测试", action -> action
    .variables(variables -> variables
        .var("method", "get"))
    .request(request -> request
        .get("/${method}/:id/detail")
        .pathVariable("id", "123")));
```

```groovy [Groovy 用例]
httpWith("路径变量测试") {
    variables {
        var "method", "get"
    }
    request {
        get '/${method}/:id/detail'
        pathVariable "id", "123"
    }
}
```

:::

### 查询参数


::: code-group

```yaml [Yaml 用例]
name: "Request URL 查询参数测试用例"
steps:
  - name: 查询参数测试
    http:
      url: /get?lang=java&name=java
      method: GET
      # 根据 HTTP 协议，查询参数允许多值，所以 name 最终的值为 name=java&name=groot
      params:
        name: groot
        age: 18

  - name: 查询参数多值测试
    http:
      url: /get?lang=java&age=18
      method: GET
      params:
        - name: name
          value: java
        - name: name
          value: groot
```

```java [Java 用例]
httpWith("查询参数测试", action -> action
    .request(request -> request
        .get("/get?lang=java&name=java")
        .queryParam("name", "groot")
        .queryParam("age", "18")));

httpWith("查询参数多值测试", action -> action
    .request(request -> request
        .get("/get?lang=java&age=18")
        .queryParam("name", "java", "groot")));
```

```groovy [Groovy 用例]
httpWith("查询参数测试") {
    request {
        get "/get?lang=java&name=java"
        queryParam "name", "groot"
        queryParam "age", "18"
    }
}

httpWith("查询参数多值测试") {
    request {
        get "/get?lang=java&age=18"
        queryParam "name", "java", "groot"
    }
}
```

:::




### headers

请求 Header。

::: code-group

```yaml [Yaml 用例]
name: Request Headers 测试用例
steps:
  - name: Header Name 不重复
    http:
      url: /headers
      method: GET
      headers:
        X-Token: Z3Jvb3Q=
        OrderId: 872160725

  - name: Header Name 重复
    http:
      url: /headers/duplicate
      method: GET
      headers:
        - name: X-Token
          value: Z3Jvb3Q=
        - name: ids
          value: 166
        - name: ids
          value: 288

  - name: Header 值包含表达式
    variables:
      token: Z3Jvb3Q=
      startValue: 872
    http:
      url: /headers
      method: GET
      headers:
        X-Token: ${token}
        OrderId: ${startValue}160725
```

```java [Java 用例]
http("Header Name 不重复", request -> request
    .get("/headers")
    .headers(
        "X-Token", "Z3Jvb3Q=",
        "OrderId", "872160725"
    ));

http("Header Name 重复", request -> request
    .get("/headers/duplicate")
    .headers(
        "X-Token", "Z3Jvb3Q=",
        "ids", "166",
        "ids", "288"
    ));

httpWith("Header 值包含表达式", action -> action
    .variables(variables -> variables
        .var("token", "Z3Jvb3Q=")
        .var("startValue", "872"))
    .request(request -> request
        .get("/headers")
        .headers(
            "X-Token", "${token}",
            "OrderId", "${startValue}160725"
        )));
```

```groovy [Groovy 用例]
http("Header Name 不重复") {
    get "/headers"
    headers "X-Token", "Z3Jvb3Q=", "OrderId", "872160725"
}

http("Header Name 重复") {
    get "/headers/duplicate"
    headers "X-Token", "Z3Jvb3Q=",
        "ids", "166",
        "ids", "288"
}

httpWith("Header 值包含表达式") {
    variables {
        var "token", "Z3Jvb3Q="
        var "startValue", "872"
    }
    request {
        get "/headers"
        headers "X-Token", '${token}',
            "OrderId", '${startValue}160725'
    }
}
```

:::

多值 Header 是指多个 Header 名称相同，值不同。比如下面的 ids Header：

```
GET http://localhost:62549/headers/duplicate HTTP/1.1
X-Token: Z3Jvb3Q=
ids: 166
ids: 288
Host: localhost:62549
Connection: Keep-Alive
Accept-Encoding: gzip
User-Agent: okhttp/4.12.0

<none> 
```

### cookies

::: code-group

```yaml [Yaml 用例]
name: Request Header Cookies 测试用例
steps:
  - name: Cookies 测试
    http:
      url: /headers/cookies
      method: GET
      headers:
        Cookie: kv1=111111; kv2=value2
      # cookies 优先级高于 headers
      cookies:
        kv1: value1

  - name: Cookie 值包含表达式
    variables:
      kv1: value1
      kv2: value2
    http:
      url: /headers/cookies
      method: GET
      cookies:
        kv1: ${kv1}
        kv2: ${kv2}
```

```java [Java 用例]
http("Cookies 测试", request -> request
    .get("/headers/cookies")
    .headers("Cookie", "kv1=111111; kv2=value2")
    .cookies("kv1", "value1"));

httpWith("Cookie 值包含表达式", action -> action
    .variables(variables -> variables
        .var("kv1", "value1")
        .var("kv2", "value2"))
    .request(request -> request
        .get("/headers/cookies")
        .cookies(
            "kv1", "${kv1}",
            "kv2", "${kv2}"
        )));
```

```groovy [Groovy 用例]
http("Cookies 测试") {
    get "/headers/cookies"
    headers "Cookie", "kv1=111111; kv2=value2"
    cookies "kv1", "value1"
}

httpWith("Cookie 值包含表达式") {
    variables {
        var "kv1", "value1"
        var "kv2", "value2"
    }
    request {
        get "/headers/cookies"
        cookies "kv1", '${kv1}', "kv2", '${kv2}'
    }
}
```

:::

### body

#### json

请求 Body 为 JSON 字符串或对象。

- `Content-Type: application/json`，可手动覆盖。
- 请求 Body：
    - JSON 字符串：替换（计算）字符串中的表达式后发送。
    - 对象：替换（计算）对象中的表达式，并将对象序列化为 JSON 字符串后发送。

::: code-group

```yaml [Yaml 用例]
name: JSON 测试用例
urlAndMethod: &urlAndMethod
  url: /json/stringOrObject
  method: POST
variables:
  name: "groot"
  age: 18
steps:
  - name: 值类型为 String
    http:
      <<: *urlAndMethod
      json: |
        {
          "name": "groot",
          "age": 18
        }

  - name: 值类型为 Object
    http:
      <<: *urlAndMethod
      json:
        name: "groot"
        age: 18

  - name: 在 String 中使用表达式
    http:
      <<: *urlAndMethod
      json: |
        {
          "name": "${name}",
          "age": ${age}
        }

  - name: 在 Object 中使用表达式
    http:
      <<: *urlAndMethod
      json:
        name: ${name}
        age: ${age}
```

```java [Java 用例]
sv("name", "groot");
sv("age", 18);

http("值类型为 String", request -> request
    .post("/json/stringOrObject")
    .json("""
        {
          "name": "groot",
          "age": 18
        }
        """));

http("值类型为 Object", request -> request
    .post("/json/stringOrObject")
    .json(Map.of(
        "name", "groot",
        "age", 18
    )));

http("在 String 中使用表达式", request -> request
    .post("/json/stringOrObject")
    .json("""
        {
          "name": "${name}",
          "age": ${age}
        }
        """));

http("在 Object 中使用表达式", request -> request
    .post("/json/stringOrObject")
    .json(Map.of(
        "name", "${name}",
        "age", "${age}"
    )));
```

```groovy [Groovy 用例]
sv("name", "groot")
sv("age", 18)

http("值类型为 String") {
    post "/json/stringOrObject"
    json '''
        {
          "name": "groot",
          "age": 18
        }
        '''
}

http("值类型为 Object") {
    post "/json/stringOrObject"
    json(["name": "groot", "age": 18])
}

http("在 String 中使用表达式") {
    post "/json/stringOrObject"
    json('''
        {
          "name": "${name}",
          "age": ${age}
        }
        ''')
}

http("在 Object 中使用表达式") {
    post "/json/stringOrObject"
    json([
        'name': '${name}',
        'age' : '${age}'
    ])
}
```

:::

当 json 字段或方法的值为表达式字符串时，计算结果中如果仍然存在表达式，不会二次计算。

比如 `${returnObject_tpje()}` 返回一个 `HashMap<String, String>`，map 的值中包含表达式，不会再次计算该 Map 中的表达式，而是直接将 Map 对象序列化为 JSON 字符串后发送。

```yaml [Yaml 用例]
name: JSON 测试用例
steps:
  - name: 表达式返回 JSON 字符串
    http:
      url: /json/expression
      method: POST
      json: ${returnJsonString_tpje()}
  - name: 表达式返回一个对象
    http:
      url: /json/expression
      method: POST
      json: ${returnObject_tpje()}
```

#### binary

其他 Body 类型，不再演示完整示例，参考上面 json 的用法。

默认 Content-Type 的计算（未显示指定时）：

- 当 binary 的值为 File 类型时，根据文件后缀名计算，比如：
    - `.json` 为 `application/json`
    - `.jpg` 为 `image/jpeg`
    - `.pdf` 为 `application/pdf` 
    - `.xlsx` 为 `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- 当 binary 的值为 byte[] 类型，默认为 `application/ octet-stream`

::: code-group

```yaml [Yaml 用例]
# 使用 base64 值表示 byte[]
binary:
  base64: Z3Jvb3Q=

# 标准写法，这种写法表示 binary 为 File，请求时 Body 为文件内容
binary:
  file: data/中文.pdf

# 简写，如果值不是表达式或表达式结果为 String 类型，则当作文件 ID 处理
binary: data/${fileName}   # 表达式的值表示文件 ID
binary: data/中文.pdf

# 请求 Body 为表达式的值，表达式结果只能是 byte[]、File 或 String(视为文件 ID) 类型
binary: ${randomByteArray_tpbe()}
```

```java [Java 用例]
// byte[] 类型
binary("groot".getBytes(StandardCharsets.UTF_8))

// 文件 ID
binary("data/中文.pdf")
binary(new File("data/中文.pdf"))

// 表达式，表达式结果只能是 byte[]、File 或 String(视为文件 ID) 类型
binary("data/${fileName}")
binary("${randomByteArray_tpbe()}")
```

```groovy [Groovy 用例]
// byte[] 类型
binary "groot".getBytes(StandardCharsets.UTF_8)

// 文件 ID
binary "data/中文.pdf"
binary new File("data/中文.pdf")

// 表达式，表达式结果只能是 byte[]、File 或 String(视为文件 ID) 类型
binary 'data/${fileName}'
binary '${randomByteArray_tpbe()}'
```

:::

#### data

data 支持任意的请求数据类型，包括字节数组、文件、字符串等。

- 当请求 Body 为 JSON 字符串时，推荐使用 json。
- 当请求 Body 为 byte[] 或文件 ID 时，推荐使用 binary。
- 其他情况，比如请求 Body 为 XML/HTML/TXT 等格式时，使用 data。

```
any data: byte[]/File/String/Object
最终类型是指经过计算后的类型，比如 data("${toFile('xxx.jpg')}") 传入类型是 String，
但计算后的类型为 File，即最终类型为 File

最终类型   ->  转换后类型   -> 默认 Content-Type
------------------------------------------------------------
byte[]    ->  byte[]     -> application/octet-stream
File      ->  File       -> 文件后缀名决定，默认 application/octet-stream
String    ->  String     -> application/json
Object    ->  JSONString -> application/json
```

::: code-group

```yaml [Yaml 用例]
# 值类型为 String
data: |
  {
    "name": "groot",
    "age": 18
  }

# 值类型为 Object
data:
  name: "groot"
  age: 18

# 在 String 中使用表达式
data: |
  {
    "name": "${name}",
    "age": ${age}
  }

# 在 Object 中使用表达式
data:
  name: ${name}
  age: ${age}

# 表达式返回 JSON 字符串
data: ${returnJsonString_tpde()}

# 表达式返回一个对象
data: ${returnObject_tpde()}
```

```java [Java 用例]
与 json 类似，但换成 data 或 body 方法
```

```groovy [Groovy 用例]
与 json 类似，但换成 data 或 body 方法
```

:::

#### form

默认 Content-Type 为 `application/x-www-form-urlencoded`，可手动指定。

::: code-group

```yaml [Yaml 用例]
# 标准写法，Key 重复
form:
  - name: hello
    value: 您好
  - name: id
    value: 1
  - name: id
    value: 2

# 简写，Key 不重复
form:
  hello: 您好
  id: 1
```

```java [Java 用例]
// 多值参数（id）
formParam("id", "1", "2")

// 非多值参数
formParam("hello", "您好")
formParam("id", "1")
formParams("hello", "您好", "id", "1")
```

```groovy [Groovy 用例]
// 多值参数（id）
formParam "id", "1", "2"

// 非多值参数
formParam "hello", "您好"
formParam "id", "1"
formParams "hello", "您好", "id", "1"
```

:::

#### multipart

1. 文件上传（Part Body 为文件内容）。

::: code-group

```yaml [Yaml 用例数据结构]
multipart:
  # == 数据结构(字典结构写法，Part.Name 不可重复) ==
  file:             -> Part.Name(文件必须使用 file 字符串，仅支持一个文件)
    type: String    -> Part.Header.Content-Type
    name: String    -> Part.Header.Content-Disposition -> filename
    file: String    -> Part.Body(文件 ID)
  file: String      -> 简写，值=file.file 的值
  otherKey:         -> Part.Name(非文件，使用 file 之外的任意字符串，不可重复)
    type: String    -> Part.Header.Content-Type
    value: anyType  -> Part.Body(非文件)
  otherKey: String  -> 简写，值=otherKey.value 的值

  # == 数据结构（列表结构写法，Part.Name 可重复） ==
  - name: String    -> Part.Name(可重复)(file 可以同时省略 name 和 headers，body 不可同时省略 name 和 headers)
    headers: List<Header>/Map<headerKey, headerValue>   -> Part.Headers
    file: String    -> Part.Body(文件)
    body: anyType   -> Part.Body(非文件)
```

```yaml [Yaml 用例]
# --- 单个文件上传（字典结构，name 不可重复，即 file 只能有一个） ---
# 字典结构标准语法（本质上这也是简写语法，平台开发应采用列表结构标准写法，见下面的多文件上传）
multipart:
  file:
    file: data/中文.txt   # 文件 ID，ID 默认使用本地文件路径
    name: 武功秘籍.txt     # 修改 filename 的值
    type: text/plain      # 修改 content-type 的值
# 省略 name 和 type，则 filename 等于文件名称，content-type 根据文件后缀名自动计算
multipart:
  file:
    file: data/中文.txt
# 简写语法，效果同上面的写法
multipart:
  file: data/中文.txt


# --- 多个文件上传（列表结构，name 可重复） ---
# 标准写法
multipart:
  - name: file
    headers:
      Content-Disposition: form-data; name="file"; filename="降龙十八掌.txt"
      Content-Type: text/plain
    file: data/降龙十八掌.txt
  - name: file
    headers:
      Content-Disposition: form-data; name="file"; filename="独孤九剑.txt"
      Content-Type: text/plain
    file: data/独孤九剑.txt
# 省略 name 和 headers，根据文件名称自动计算
multipart:
  - file: data/降龙十八掌.txt
  - file: data/独孤九剑.txt
# 存在多值 Header 时，headers 使用列表结构
multipart:
  - name: file
    headers:
      - name: Content-Disposition
        value: form-data; name="file"; filename="中文.pdf"
      - name: Content-Type
        value: application/pdf
    file: data/中文.pdf
```

```java [Java 用例]
// --- 文件上传：每次调用 multiPartFile 会追加 Part ---

// 依次指定 name filename filepath content-type
multiPartFile("file", "武功秘籍.txt", "data/中文.txt", "text/plain")
// 仅指定 filepath，其他参数根据文件名称自动计算
multiPartFile("data/中文.txt")
multiPartFile(new File("src/test/resources/data/中文.txt"))
// 更多重载方法见源码

// 指定 Part.Headers（可以添加其他 Header）
HeaderManager headers = HeaderManager.of(
    "Content-Disposition", "form-data; name=\"file\"; filename=\"武功秘籍.txt\"",
    "Content-Type", "text/plain"
);
http("上传文件", request -> request
    .post("/multipart/upload")
    .multiPartFile("file", headers, "data/中文.txt"));
```

```groovy [Groovy 用例]
// --- 文件上传：每次调用 multiPartFile 会追加 Part ---

// 依次指定 name filename filepath content-type
multiPartFile "file", "武功秘籍.txt", "data/中文.txt", "text/plain"
// 仅指定 filepath（自动解析文件名和类型）
multiPartFile "data/中文.txt"
multiPartFile new File("src/test/resources/data/中文.txt")
// 更多重载方法见源码

// 带自定义 Headers 的上传
def headers = HeaderManager.of(
    'Content-Disposition', 'form-data; name="file"; filename="武功秘籍.txt"',
    'Content-Type', 'text/plain'
)
http("上传文件") {
    post "/multipart/upload"
    multiPartFile "file", headers, "data/中文.txt"
}
```

:::

实际发送的 Part 内容示例。

::: code-group

``` [单文件上传]
--e9116a6b-3242-4a38-b5ff-28c6a83e874a
Content-Disposition: form-data; name="file"; filename="武功秘籍.txt"
Content-Type: text/plain
Content-Length: 12

</Users/yun/Documents/code/ly1012/groot/groot-protocol/groot-http/src/test/resources/data/中文.txt>
--e9116a6b-3242-4a38-b5ff-28c6a83e874a-- 
```

``` [多文件上传]
--fdb02a5a-2e16-4014-ac59-8aee1d703e13
Content-Disposition: form-data; name="file"; filename="降龙十八掌.txt"
Content-Type: text/plain
Content-Length: 15

</Users/yun/Documents/code/ly1012/groot/groot-protocol/groot-http/src/test/resources/data/降龙十八掌.txt>
--fdb02a5a-2e16-4014-ac59-8aee1d703e13
Content-Disposition: form-data; name="file"; filename="独孤九剑.txt"
Content-Type: text/plain
Content-Length: 12

</Users/yun/Documents/code/ly1012/groot/groot-protocol/groot-http/src/test/resources/data/独孤九剑.txt>
--fdb02a5a-2e16-4014-ac59-8aee1d703e13-- 
```

:::


2. 文件/文本数据（Part Body 为文件或文本）。

::: code-group

```yaml [Yaml 用例(Name 不重复)]
# 不存在重复 Part Name 时，使用字典结构写法更简单
multipart:
  #file: data/降龙十八掌.txt  # 和下面的写法等价，type 根据文件后缀名自动计算
  file:
    type: text/plain
    name: 降龙十八掌.txt
    file: data/降龙十八掌.txt
  # 默认 Content-Type = text/plain
  helloMessage: "hello groot"
  # 指定 Content-Type
  helloMsg:
    type: text/plain
    value: "hello groot"
  # Body 为对象表示
  orderDetail:
    type: application/json
    value:
      orderId: "123456789"
      owner: "groot"
      productList:
        - productId: "666"
          productName: "六六六"
        - productId: "888"
          productName: "发发发"
```

```yaml [Yaml 用例(Name 重复)]
# 存在重复 Part Name 时，使用列表结构写法
multipart:
  # == 示例(file) ==
  # 完整写法，可以修改任意部分的值，比如 name、headers，headers 支持多值（重复 Key）
  - name: file
    headers:
      - name: Content-Disposition
        value: form-data; name="file"; filename="中文.pdf"
      - name: Content-Type
        value: application/pdf
    file: data/中文.pdf

  # == 示例(body) ==
  # 完整写法（区别在于 Part.Body 使用 body 字段，而非 file 字段）
  - name: k1
    headers:
      - name: Content-Disposition
        value: form-data; name="k1"
      - name: Content-Type
        value: application/json
    body:
      mk1: mv1
      mk2:
        mk3: mv3

  # == 示例(Part.Name) ==
  # 简写（等价于上面的写法，name=file，headers 根据文件名自动补全）
  - file: data/中文.pdf
  # 省略 Part.Name（name 从 Content-Disposition 中提取）
  - headers:
      Content-Disposition: form-data; name="k1"
      Content-Type: text/plain
    body: textValue

  # == 示例(Part.Headers) ==
  # Part.Headers 简写（当 Header Name 不重复时）
  - name: k1
    headers:
      Content-Disposition: form-data; name="k1"
      Content-Type: text/plain
    body: textValue
  # 省略 Part.Headers（等价于上面的写法，默认为 text/plain）
  - name: k1
    body: textValue
  # 省略 Part.Headers 中的 Content-Disposition 和 Content-Type
  - name: k2
    headers:
      myHeader: myValue
    body: textValue2
  # 多值 Header
  - name: k3
    headers:
      - name: myHeader
        value: myValue1
      - name: myHeader
        value: myValue2
    body: textValue2
```

```java [Java 用例]
和上面的文件上传示例类似，方法调用时 IDE 会给出提示，不再演示：

文件：调用 multiPartFile
文本：调用 multiPart（part.body 为 byte[]/String/File 类型)

// multiPartFile -> Content-Disposition 中包含 filename
Content-Disposition: form-data; name="<name>"; filename="<filename>" 
Content-Type: <contentType>

// multiPart -> Content-Disposition 中不包含 filename
Content-Disposition: form-data; name="<name>" 
Content-Type: application/json
```

```groovy [Groovy 用例]
和上面的文件上传示例类似，方法调用时 IDE 会给出提示，不再演示：

文件：调用 multiPartFile
文本：调用 multiPart（part.body 为 byte[]/String/File 类型)

// multiPartFile -> Content-Disposition 中包含 filename
Content-Disposition: form-data; name="<name>"; filename="<filename>" 
Content-Type: <contentType>

// multiPart -> Content-Disposition 中不包含 filename
Content-Disposition: form-data; name="<name>" 
Content-Type: application/json
```

:::


## HTTP 响应

### download

将响应内容保存到指定文件。

::: code-group

```yaml [Yaml 用例]
- name: 相对路径
  http:
    url: /download
    method: GET
    download: download/独孤九剑孤本.txt

- name: 绝对路径
  http:
    url: /download
    method: GET
    download: ${projectDirectory}/src/test/resources/download/独孤九剑孤本.txt
```

```java [Java 用例]
http("相对路径", request -> request
    .get("/download")
    .download("download/独孤九剑孤本.txt"));

http("绝对路径", request -> request
    .get("/download")
    .download("${projectDirectory}/src/test/resources/download/独孤九剑孤本.txt"));
```

```groovy [Groovy 用例]
http("相对路径") {
    get "/download"
    download "download/独孤九剑孤本.txt"
}

http("绝对路径") {
    get "/download"
    download '${projectDirectory}/src/test/resources/download/独孤九剑孤本.txt'
}
```

:::

## 提取

公共提取器见 [提取器](/reference/extractor/jsonpath)。

### Header 提取

header 提取器，提取响应头中指定 Header 的值，多值 Header 时提取第一个。所谓多值 Header 是指同名 header 出现多次，比如下面示例中的 multiHeader 。

scope 表示提取变量的作用域，默认为 ALL，详见 [提取作用域](/guide/writing/extractor#提取变量默认值和作用域)。

::: code-group

``` [响应头]
Content-Type: application/json
multiHeader: value1
multiHeader: value2
```

```yaml [Yaml 用例]
extract:
  - header:
      refName: type
      headerName: Content-Type
      scope: session
  - header:
      refName: non
      headerName: nonHeader
      default: "noValue"
```

```java [Java 用例]
.extract(extract -> extract
    .header("type", "Content-Type", params -> params.scope(ExtractScope.SESSION))
    .header("non", "nonHeader", params -> params.defaultValue("noValue")))
```

```groovy [Groovy 用例]
extract {
    header "type", "Content-Type", { scope ExtractScope.SESSION }
    header "non", "nonHeader", { defaultValue "noValue" }
}
```

:::


## 断言

Matcher 断言用法详见 [matcher](/guide/writing/assertion#matcher)，这里仅演示 statusCode 断言的具体用法。

### 响应状态码断言

响应状态码断言，`HttpStatusCodeMatcherAssertion extends MatcherAssertion<Integer>`。

::: code-group

```yaml [Yaml 用例]
# 默认为相等断言
- statusCode: 200
# mapper 用于值转换
# matchers 对应 Hamcrest Matcher
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
// 默认使用 equalTo 匹配
statusCode(200)
// 多个 Matcher
statusCode(Matchers.lessThan(300), Matchers.greaterThanOrEqualTo(200))
// mapper
statusCode(
    Function.<Integer>identity()
        .andThen(Mappings.toStr())
        .andThen(__internal_arguments_test_mapping("(((", ")))"))
        .andThen(__INTERNAL_NO_ARGUMENTS_TEST_MAPPING)
        .andThen(s -> s + "!!!"),
    equalTo("<<<(((200)))>>>!!!"))
statusCode(
    MappingsBuilder.<Integer, String>mappings()
        .toStr()
        .map(__internal_arguments_test_mapping("(((", ")))"))
        .map(__INTERNAL_NO_ARGUMENTS_TEST_MAPPING)
        .map(s -> s + "!!!")
        .build(),
    equalTo("<<<(((200)))>>>!!!"))));
```

```groovy [Groovy 用例]
// 默认使用 equalTo 匹配
statusCode 200
// 多个 Matcher
statusCode Matchers.lessThan(300), Matchers.greaterThanOrEqualTo(200)
// mapper
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
```

:::

### 响应 Header 断言

响应 Header 断言，`HttpHeaderMatcherAssertion extends MatcherAssertion<String>`。

::: code-group

```yaml [Yaml 用例]
- header:
    headerName: Content-Type
    matchers:
      - equalTo: "application/json"
```

```java [Java 用例]
header("Content-Type", "application/json")
header("Content-Type", equalTo("application/json"))
```

```groovy [Groovy 用例]
header "Content-Type", "application/json"
header "Content-Type", equalTo("application/json")
```

:::

多个 header 断言需要声明多次。后续可能支持 headers 断言（暂时没做），设计如下（本质上是语法糖，会转为标准 Header 断言）：

```yml
- headers:
    Content-Type: "application/json"
    myHeader: "myValue"
```

### 响应 Body 断言

响应 Body 断言，`HttpBodyMatcherAssertion extends MatcherAssertion<String>`。

::: code-group

```yaml [Yaml 用例]
- body: "海内存知己，天涯若比邻。"
# 多个 Matcher
- body:
    - equalTo: "海内存知己，天涯若比邻。"
    - containsString: "天涯"
```

```java [Java 用例]
body("海内存知己，天涯若比邻。")
body(Matchers.equalTo("海内存知己，天涯若比邻。"), Matchers.containsString("天涯"))
```

```groovy [Groovy 用例]
body "海内存知己，天涯若比邻。"
body Matchers.equalTo("海内存知己，天涯若比邻。"), Matchers.containsString("天涯")
```

:::



## 复用

以下介绍文档基于 Yaml/Json 用例，代码风格用例推荐使用类、方法或函数进行复用性封装。

### 引用 API

API 定义对应的是 HttpAPI 类。

::: code-group

```yml [api.yml]
url: /coupon/templet
method: POST
service: couponToB
```

```yml [引用 API]
name: 引用接口 API 测试用例
steps:
  - name: 引用接口 API
    http:
      api: apis/CouponService/templet/createTemplet/api.yml
      json:
        templetType: "0"
        discountValue: 33
        maxDiscountAmt: 111
        validDays: 60
        validType: "0"
        usablePlatform:
          wx: "1"
          app: "1"
          pc: "1"
    validate:
      - statusCode: 200
```

:::

### 引用模板

API 模板与 Http 请求对应的都是 HttpSampler 类。


::: code-group

```yml [折扣券.yml]
name: 折扣券
# 定义变量，引用方可覆盖默认值
variables:
  discountValue: 20
  maxDiscountAmt: 100
http:
  api: apis/CouponService/templet/createTemplet/api.yml
  json:
    templetType: "0"
    discountValue: ${discountValue}
    maxDiscountAmt: ${maxDiscountAmt}
    validDays: 60
    validType: "0"
    usablePlatform:
      wx: "1"
      app: "1"
      pc: "1"
validate:
  - statusCode: 200
```

```yml [限时券.yml]
name: 限时券
# 定义变量，引用方可覆盖默认值
variables:
  discountValue: 20
  maxDiscountAmt: 100
http:
  api: apis/CouponService/templet/createTemplet/api.yml
  json:
    templetType: "1"
    discountValue: ${discountValue}
    maxDiscountAmt: ${maxDiscountAmt}
    validFrom: "2024-10-14"
    validTo: "2024-11-11"
    validType: "1"
    usablePlatform:
      wx: "1"
      app: "1"
      pc: "1"
validate:
  - statusCode: 200
```

```yml [引用模板]
name: 引用接口请求模板测试用例
description: |
  请求模板通常用于造数测试用例、流程测试用例，单接口测试用例一般用不到请求模板。
  当一个请求 JSON 有较多字段时，关注的字段使用变量，不关注的字段使用默认值。
  请求模板除提供复用外，还可以提高可维护性，比如以下接口变更仅需改动模板即可：
  增加了不关注的新字段、修改了某个字段的类型或枚举值（比如从 0 变成了 true）、修改了字段名称
steps:
  - name: 新增一张折扣券
    variables:
      discountValue: 33
    http:
      template: apis/CouponService/templet/createTemplet/折扣券.yml

  - name: 新增一张限时券
    variables:
      discountValue: 33
    http:
      template: apis/CouponService/templet/createTemplet/限时券.yml

```

:::


### 引用用例



::: code-group

```yaml [封装多个步骤为一个用例]
name: 创建多张卡券
description: |
  1. 创建 N 张折扣券
  2. 创建 M 张限时券
variables:
  nCount: 1
  mCount: 1
  total: 0
teardown:
  - validate:
      - equalTo: ["${total}", "${nCount + mCount}"]
steps:
  - name: 创建 ${nCount} 张折扣券
    repeat: ${nCount}
    steps:
      - name: 新增一张折扣券
        variables:
          discountValue: 33
        http:
          template: apis/CouponService/templet/createTemplet/折扣券.yml
        teardown:
          - hooks: ${vars.put("total", total + 1)}

  - name: 创建 ${mCount} 张限时券
    repeat: ${mCount}
    steps:
      - name: 新增一张限时券
        variables:
          discountValue: 33
        http:
          template: apis/CouponService/templet/createTemplet/限时券.yml
        teardown:
          - hooks: ${vars.put("total", total + 1)}
```

```yml [引用用例]
name: 引用测试用例
description: |
  引用其他已存在的测试用例。
  请求模板是某个协议请求的模板，而测试用例是一个或多个测试步骤的集合，可以实现比请求模板更复杂的复用模板。
steps:
  - name: 引用某个测试用例模板
    variables:
      nCount: 3
      mCount: 2
    testcase: tcts/createCoupons.yml
```

:::

