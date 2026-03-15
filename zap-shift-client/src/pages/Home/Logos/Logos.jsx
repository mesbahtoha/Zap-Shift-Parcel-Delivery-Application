import Marquee from "react-fast-marquee";
import amazon from '../../../assets/brands/amazon.png';
import amazon_vector from '../../../assets/brands/amazon_vector.png';
import casio from '../../../assets/brands/casio.png';
import moonstar from '../../../assets/brands/moonstar.png';
import randstad from '../../../assets/brands/randstad.png';
import start from '../../../assets/brands/start.png';
import start2 from '../../../assets/brands/start2.png';

const Logos = () => {
    return (
        <div className="py-10 ">
            <h2 className="text-center font-extrabold text-2xl text-[#03373D]">We've helped thousands of sales teams</h2>
            <Marquee className="h-28" speed={45} pauseOnHover={true}>
                <img src={amazon} alt="" style={{ height: "24px", margin: "0 40px" }} />
                <img src={amazon_vector} alt="" style={{ height: "24px", margin: "0 40px" }} />
                <img src={casio} alt="" style={{ height: "24px", margin: "0 40px" }} />
                <img src={moonstar} alt="" style={{ height: "24px", margin: "0 40px" }} />
                <img src={randstad} alt="" style={{ height: "24px", margin: "0 40px" }} />
                <img src={start} alt="" style={{ height: "24px", margin: "0 40px" }} />
                <img src={start2} alt="" style={{ height: "24px", margin: "0 40px" }} />
            </Marquee>
        </div>

    );
}

export default Logos;