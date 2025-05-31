---
outline: deep
---

每个 Groot 实例使用各自的全局配置数据对象和环境配置数据对象（内容可能相同）。

全局配置、环境配置、用例配置、以及控制器步骤的配置上下文具有完全相同的配置项。在整个配置链中（上下文链），子级配置会覆盖父级的同名配置项。

比如，全局配置如下：

```yml
http:
  any:
    baseUrl: http://localhost:8080/
    headers:
      title: 标题1
```

test 环境配置：

```yml
http:
  any:
    baseUrl: http://192.168.1.24:55423/
    headers:
      title: 标题2
```

测试用例：

```yml
name: 配置覆盖测试用例
config:
  http:
    any:
      headers:
        title: 标题3
steps:
  - name: 分组 A
    group: 1
    steps:
      - name: Get 请求
        config:
          http:
            any:
              headers:
                title: 标题4    
        http:
          url: /get
          method: GET
          headers:
            OrderId: 872160725
        validate:
          - statusCode: 200
```

现在使用 test 环境执行测试用例，则 HTTP 请求的 baseUrl 为 `http://192.168.1.24:55423/`，请求 Header title 的值为 `标题4`。



