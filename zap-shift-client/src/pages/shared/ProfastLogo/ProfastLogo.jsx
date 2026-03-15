import logo from '../../../assets/logo.png'

const ProfastLogo = () => {
    return (
        <section>
            <div className='flex items-end'>
                <img className='mb-1.5' src={logo} alt="" />
                <p className='text-3xl -ml-4 font-extrabold'>Profast</p>
            </div>
        </section>
    )
}

export default ProfastLogo;