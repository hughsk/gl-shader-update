var extract = require('glsl-extract-sync')
var uniq    = require('uniq')
var update  = module.exports = {
    frag: updater('FRAGMENT_SHADER', 'fragmentShader', 'fragment')
  , vert: updater('VERTEX_SHADER', 'vertexShader', 'vertex')
}

function updater(type, key, kind) {
  return function update(shader, replacement) {
    var gl = shader.gl

    var newShader = gl.createShader(gl[type])
    gl.shaderSource(newShader, replacement)
    gl.compileShader(newShader)
    if (!gl.getShaderParameter(newShader, gl.COMPILE_STATUS)) {
      throw new Error("Error compiling "+kind+" shader: " + gl.getShaderInfoLog(shader[key]))
    }

    gl.detachShader(shader.handle, shader[key])
    gl.deleteShader(shader[key])
    gl.attachShader(shader.handle, shader[key] = newShader)
    gl.linkProgram(shader.handle, newShader)

    return updateShaderExports(shader)
  }
}

function updateShaderExports(shader) {
  var gl         = shader.gl
  var vertSrc    = gl.getShaderSource(shader.vertexShader)
  var fragSrc    = gl.getShaderSource(shader.fragmentShader)

  var vertExp    = extract(vertSrc)
  var fragExp    = extract(fragSrc)

  var uniforms   = uniq(vertExp.uniforms.concat(fragExp.uniforms))
  var attributes = vertExp.attributes

  if (!shader.updateExports) return warn(), shader

  shader.updateExports(uniforms, attributes)

  return shader
}

function warn() {
  warn = function(){}
  console.warn(
    "You're using an out of date version of gl-shader-core, " +
    "which won't support dynamically changing uniforms/attributes"
  )
}
