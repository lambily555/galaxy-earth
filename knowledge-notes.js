(()=>{
 'use strict';
 const notes=[
  {
    "title": "01 · 输出：文字和计算",
    "body": "print()显示结果。带引号的是文字，不带引号的数字表达式会计算。",
    "code": "print(\"18 + 2\")\nprint(18 + 2)",
    "extra": "示例输出分别是18 + 2与20。使用英文括号和成对引号。"
  },
  {
    "title": "02 · 变量与计算",
    "body": "变量保存数据；等号把右侧结果赋给左侧变量。",
    "code": "visits = 120\nusers = 30\nprint(visits / users)",
    "extra": "这里使用虚构教学数据，不代表真实业务。计算平均值前先检查分母。"
  },
  {
    "title": "03 · 表格读取与预览",
    "body": "先确认文件、工作表和表头，再检查读取结果。路径请替换为自己的练习文件。",
    "code": "import pandas as pd\ndf = pd.read_excel(\"example.xlsx\", sheet_name=0)\nprint(df.head())\nprint(df.shape)",
    "extra": "head()默认显示前5行；shape表示行数和列数。"
  },
  {
    "title": "04 · 日期排序与绘图",
    "body": "先转换日期并排序，再绘制折线；坐标标签不改变原数据。",
    "code": "import matplotlib.pyplot as plt\ndf[\"date\"] = pd.to_datetime(df[\"date\"])\ndf = df.sort_values(\"date\")\nplt.plot(df[\"date\"], df[\"value\"])\nplt.xticks(rotation=45)\nplt.tight_layout()\nplt.show()",
    "extra": "date和value是示例列名，应根据自己的文件调整。"
  }
];
 const dialog=document.createElement('dialog');dialog.id='pythonKnowledge';dialog.style.cssText='width:min(900px,92vw);max-height:86vh;overflow:auto';
 const heading=document.createElement('h2');heading.textContent='Python 知识笔记';dialog.append(heading);
 const intro=document.createElement('p');intro.textContent='通用教学示例；个人答案、批改与学习进度保留在自己的本地目录。';dialog.append(intro);
 for(const note of notes){const section=document.createElement('section');section.style.cssText='border-top:1px solid #344d60;padding:12px 0';for(const [tag,value] of [['h3',note.title],['p',note.body],['pre',note.code],['p',note.extra]]){const el=document.createElement(tag);el.textContent=value;if(tag==='pre')el.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;padding:14px;background:#091522;color:#deedf7';section.append(el);}dialog.append(section);}
 const close=document.createElement('button');close.textContent='关闭笔记';close.onclick=()=>dialog.close();dialog.append(close);document.body.append(dialog);
 document.addEventListener('keydown',e=>{if(dialog.open&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dialog.close();}},true);
 const open=()=>{dialog.showModal();dialog.scrollTop=0;};
 for(const [parent,id] of [[document.getElementById('spaceMenu'),'pythonKnowledgeOpen'],[document.querySelector('.lesson-bar'),'lessonKnowledgeOpen']]){const button=document.createElement('button');button.id=id;button.textContent='知识笔记';button.onclick=open;parent.append(button);}
})();
