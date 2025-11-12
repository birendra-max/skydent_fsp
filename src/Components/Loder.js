export default function Loder({ status }) {
    const isHidden = status === "hide";

    return (
        <div
            id="spinner"
            className={`w-full flex justify-center items-center mt-28 ${isHidden ? "hidden" : ""}`}
        >
            <img src="/img/loader.gif" alt="Loading..." className="h-16 w-16" />
        </div>
    );
}
