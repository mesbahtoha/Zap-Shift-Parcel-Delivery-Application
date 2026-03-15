import Banner from "./Banner/Banner";
import BeMerchant from "./BeMerchant/BeMerchant";
import Features from "./Features/Features";
import Logos from "./Logos/Logos";
import Services from "./Services/Services";

const Home = () => {
    return (
        <div className="max-w-11/12 mx-auto">
            <Banner></Banner>
            <Services></Services>
            <Logos></Logos>
            <Features></Features>
            <BeMerchant></BeMerchant>
        </div>
    )
}

export default Home;