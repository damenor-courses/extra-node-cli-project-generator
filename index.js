#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const shelljs = require('shelljs')
const chalk = require('chalk')
const inquirer = require('inquirer')
const render = require('./utils/templates').render 

const TEMPLATE_OPTIONS = fs.readdirSync(path.join(__dirname, 'templates'))

const QUESTIONS = [
  { 
    name: 'template',
    type: 'list',
    choices: TEMPLATE_OPTIONS,
    message: 'What kind of project do you want to generate?' 
  },
  { 
    name: 'projectName',
    type: 'input',
    message: 'What is the name of the project?',
    validate: input => {
      if(/^([a-z@]{1}[a-z\-\.\\\/0-9]{0,213})+$/.test(input)) return true
      return 'The project name can only be 214 and has to start in lowercase or with an @'
    }
  }
]

const DIR_CURRENT = process.cwd()

const handleCreateProject = (pathProject) => {

  if(fs.existsSync(pathProject)) {
    console.log(chalk.red('Cannot create project because it already exists'))
    return false
  }
  fs.mkdirSync(pathProject)
  return true

}

const handleCopyTemplate = (pathTemplate, projectName) => {

  const listFileDirectories = fs.readdirSync(pathTemplate)

  listFileDirectories.forEach(item => {

    const originalPath = path.join(pathTemplate, item)

    const stats = fs.statSync(originalPath)
    
    const writePath = path.join(DIR_CURRENT, projectName, item)

    if (stats.isFile()) {
      
      let content = fs.readFileSync(originalPath, 'utf-8')
      content = render(content, { projectName })
      fs.writeFileSync(writePath, content, 'utf-8')

      const CREATE = chalk.green('CREATE')
      const size = stats.size
      console.log(`${CREATE} ${originalPath} (${size} bytes)`)

    } 
    
    if (stats.isDirectory()) {
      fs.mkdirSync(writePath)
      handleCopyTemplate(path.join(pathTemplate, item), path.join(projectName, item))
    }

  })

}

const postProccess = (pathTemplate, pathTarget) => {

  const isNode = fs.existsSync(path.join(pathTemplate, 'package.json'))

  if (isNode) {
    shelljs.cd(pathTarget)

    console.log('\n', chalk.green(`Installing the dependencies in ${pathTarget}`), '\n')

    const result = shelljs.exec('npm install')
    if (result !== 0) {
      return false
    }
  }

}

inquirer.prompt(QUESTIONS)
  .then(({ template, projectName }) => {
    
    const pathTemplate = path.join(__dirname, 'templates', template)
    const pathTarget = path.join(DIR_CURRENT, projectName)
    const isCreatedProject = handleCreateProject(pathTarget)

    if (!isCreatedProject) return
    console.log('')
    handleCopyTemplate(pathTemplate, projectName)
    postProccess(pathTemplate, pathTarget)

  })
