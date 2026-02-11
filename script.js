const btnMain = document.getElementById('btnMain')
const btnModal = document.getElementById('btnModal')
const btnClose = document.getElementById('btnClose')
const main = document.getElementById('main')
const modal = document.getElementById('modal')

//dados modal
const sexo = document.getElementById('sexo').value
const idade = document.getElementById('idade')
const peso = document.getElementById('peso')
const altura = document.getElementById('altura')
const hemoglobina = document.getElementById('hemoglobina')
const hematocrito = document.getElementById('hematocrito')
const fluxo = document.getElementById('fluxo')
const temperatura = document.getElementById('temperatura')
const pam = document.getElementById('pam')
const lactato = document.getElementById('lactato')

//dados validações
const errorSex = document.getElementById('errorSex')


btnMain.addEventListener('click', () => {
    main.classList.add('hidden')
    modal.classList.remove('hidden')
})

btnClose.addEventListener('click', () => {
    main.classList.remove('hidden')
    modal.classList.add('hidden')
})

btnModal.addEventListener('click', () => {
    const sexo = document.getElementById('sexo').value
    const idade = Number(document.getElementById('idade').value)
    const peso = Number(document.getElementById('peso').value)
    const altura = Number(document.getElementById('altura').value)
    const hemoglobina = Number(document.getElementById('hemoglobina').value)
    const hematocrito = Number(document.getElementById('hematocrito').value)
    const fluxo = Number(document.getElementById('fluxo').value)
    const temperatura = Number(document.getElementById('temperatura').value)
    const pam = Number(document.getElementById('pam').value)
    const lactato = Number(document.getElementById('lactato').value)
    
    //validações
    if(!['masculino', 'feminino'].includes(sexo)){
        errorSex.classList.remove('hidden')
    }else{
        errorSex.classList.add('hidden')
    }
})

