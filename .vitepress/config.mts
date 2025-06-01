import { defineConfig, type DefaultTheme } from 'vitepress'
import { withMermaid } from "vitepress-plugin-mermaid";


// https://vitepress.dev/reference/site-config
export default withMermaid({
  base: "/groot-docs/",
  title: "Groot",
  description: "Java 自动化测试工具",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: nav(),

    sidebar: {
      '/guide/': { base: '/guide/', items: sidebarDocs() },
      '/reference/': { base: '/reference/', items: sidebarReference() },
      '/practice/': { base: '/practice/', items: sidebarPractice() }
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ly1012/groot' }
    ]
  },
  mermaid:{
    //mermaidConfig !theme here works for light mode since dark theme is forced in dark mode
  },
})

function nav(): DefaultTheme.NavItem[] {
  return [
    {
      text: '使用指南',
      link: '/guide/intro/introduction',
      activeMatch: '/guide/'
    },
    {
      text: '参考文档',
      link: '/reference/controller/for',
      activeMatch: '/reference/'
    },
    {
      text: '实战指导',
      link: '/practice/log/sift',
      activeMatch: '/practice/'
    }
  ]
}

/* prettier-ignore */
function sidebarDocs(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '简介',
      collapsed: false,
      base: '/guide/intro/',
      items: [
        { text: 'Groot 是什么？', link: 'introduction' },
        { text: '快速开始', link: 'quickstart' },
        { text: '核心概念', link: 'core_concept' },
        { text: '整体结构', link: 'architecture' },
      ]
    },{
      text: '编写测试',
      collapsed: false,
      base: '/guide/writing/',
      items: [
        { text: '创建项目', link: 'create_project' },
        { text: '环境管理', link: 'environment' },
        { text: '变量与函数', link: 'var_func' },
        { text: '配置上下文', link: 'config' },
        { text: '前后置处理', collapsed: true, items: [
          {text: '前置处理器', link: 'setup' },
          {text: '后置处理器', link: 'teardown' },
          {text: '提取器', link: 'extractor' },
          {text: '断言', link: 'assertion' }
        ] },
        { text: '用例参数化', link: 'parameterized_testcase' },
        { text: '步骤参数化', link: 'parameterized_step' },
        { text: '切面逻辑', link: 'aop' },
      ]
    }, {
      text: '三方集成',
      collapsed: true,
      base: '/guide/integration/',
      items: [
        { text: 'TestNG', link: 'testng' },
        { text: 'Allure', link: 'allure' },
      ]
    }, {
      text: '扩展与开发',
      collapsed: true,
      base: '/guide/extension/',
      items: [
        { text: '开发准备', link: 'prepare' },
        { text: '扩展点', link: 'extension' },
      ]
    }

  ]
}

function sidebarReference(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '控制器',
      collapsed: false,
      base: '/reference/controller/',
      items: [
        { text: '参数化控制器', link: 'for' },
        { text: 'Repeat 控制器', link: 'repeat' },
        { text: 'While 控制器', link: 'while' },
        { text: '条件控制器', link: 'if' },
        { text: '分组控制器', link: 'group' },
        { text: '执行其他用例', link: 'testcase' }
      ]
    }, {
      text: '取样器',
      collapsed: true,
      base: '/reference/sampler/',
      items: [
        { text: 'HTTP 请求', link: 'http' }
      ]
    },{
      text: '前后置处理器',
      collapsed: true,
      base: '/reference/processor/',
      items: [
        { text: 'Hooks 处理器', link: 'hooks' }
      ]
    },{
      text: '提取器',
      collapsed: true,
      base: '/reference/extractor/',
      items: [
        { text: 'JsonPath', link: 'jsonpath' }
      ]
    },{
      text: '断言',
      collapsed: true,
      base: '/reference/assertion/',
      items: [
        { text: '相等断言', link: 'equalTo' }
      ]
    },{
      text: '函数',
      collapsed: true,
      base: '/reference/function/',
      items: [
        { text: 'UUID', link: 'uuid' },
        { text: 'Sleep', link: 'sleep' },
        { text: 'Print', link: 'print' },
      ]
    },{
      text: '配置管理',
      collapsed: true,
      base: '/reference/config/',
      items: [
        { text: '应用配置', link: 'application' },
        { text: '全局和环境配置', link: 'instance' }
      ]
    }
  ]
}

function sidebarPractice(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '日志',
      collapsed: false,
      base: '/practice/log/',
      items: [
        { text: '分离用例日志', link: 'sift' }
      ]
    },
    {
      text: 'Groovy',
      collapsed: false,
      base: '/practice/groovy/',
      items: [
        { text: 'Groovy 与 Java 区别', link: 'compare' }
      ]
    }
  ]
}
