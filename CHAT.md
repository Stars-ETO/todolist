# AI提示词序列文档

## 后端开发提示词序列

1. 请使用python的fastapi框架，按照function.txt中的功能要求生成后端代码。注意要严格遵守rules.txt中的规则。请先生成整体框架，不要生成代码
2. 请进行第一部分功能代码的生成
3. 请进行下一部分代码的生成
4. 请总结一下我们代码已经实现的功能，并于function.txt文档进行功能对照，看看有没有什么遗漏的功能
5. 请进行下一部分代码的生成
6. 很好，请创建对应的apidoc.md文件和对应README.md文件，注意详细一点
7. 请生成一下单元测试集，并配置相关依赖
8. 请对单元测试集进行测试
9. 把对应的问题给灵码反馈，如：
10. 由于你使用python main.py命令时会卡住不动，现在我手动启动后端服务器，请直接进行测试
11. 请更改管理员的单元测试集
12. 下面请生成集成测试集，并安装相应依赖
13. 请对集成测试集进行测试
14. 请对发现的错误进行更改
15. 请告诉我后端服务器网址，我来进行后端整体人工测试
16. 请看errpic文件夹中的屏幕截图，出现这种问题，请告诉我解决方法
17. 更新任务分类测试结果不成功，请对代码进行更改
18. 整体测试已通过，请更新apidoc.md的api接口和README.md文件

## 前端开发提示词序列

1. 现在我要创建一个网站，后端代码已经写好，api接口如apidoc.md，后端使用方法如README.md。请严格遵守rules.md中规定的技术栈。整体技术框架已经为你准备好，现在请生成整体框架和代码编写步骤，不需要马上编写代码
2. 现在，请生成第一部分代码
3. 总结一下代码实现的功能，并与function.txt对照，还有哪些功能没有实现
4. 再次提醒，不需要你额外添加功能，添加额外的api，请严格按照rule中说的严格按照后端提供的apidoc.md的api进行编写。请把新增加的虚拟api删掉，检查目前生成的所有代码，如果有类似的虚拟api，请告诉我位置，并立即修改
5. 请生成单元测试集，并配置依赖
6. 请测试单元测试集
7. 请不要使用vue2.5中弃用的部分，使用vue3中的内容，对测试集进行更改
8. 请对新生成的测试集进行测试
9. 请生成集成测试集，并配置相关文件
10. 请对集成测试集进行测试
11. 请生成前端的README.md文件
12. 请告诉我如何测试这个网站
13. 我已经开启后端服务器与前端服务器，请告诉我网站网址
14. 请检查项目结构有没有问题，若有问题请指出
15. 现在，我在注册用户时控制台发现如下问题：
   ```
   client.ts:16 [vite] connecting... 
   main.js?t=1755610133891:7 Feature flag VUE_PROD_HYDRATION_MISMATCH_DETAILS is not explicitly defined. You are running the esm-bundler build of Vue, which expects these compile-time feature flags to be globally injected via the bundler config in order to get better tree-shaking in the production bundle.
   ```
16. 注册的问题解决了，但是登录成功时虽然网页上面连接跳转到home了，但是显示的页面没有跳转。控制台显示问题：
   ```
   client.ts:16 [vite] connecting... 
   main.js?t=1755610133891:7 Feature flag VUE_PROD_HYDRATION_MISMATCH_DETAILS is not explicitly defined. You are running the esm-bundler build of Vue, which expects these compile-time feature flags to be globally injected via the bundler config in order to get better tree-shaking in the production bundle.
   ```
17. 网站测试时分类管理：创建分类会创建2个，删除分类时弹出500错误
   ```
   categories.js:20 DELETE http://localhost:3000/api/tasks/categories/21 500 (Internal Server Error) 
   api.js:46 服务器内部错误，请稍后重试 
   CategoryManagement.vue:200 Failed to delete category: Error: Request failed with status code 500 at createError (createError.js:16:15) at settle (settle.js:17:12) at XMLHttpRequest.onloadend (xhr.js:66:7)
   ```

18. 网页控制台给出以下错误，请参考解决分类管理出现的问题：
   ```
   The label's for attribute doesn't match any element id. This might prevent the browser from correctly autofilling the form and accessibility tools from working correctly.
   
   To fix this issue, make sure the label's for attribute references the correct id of a form field.
   ```

19. 后端服务器已经手动启动成功，如果你想要看完整的错误日志可以看log，继续