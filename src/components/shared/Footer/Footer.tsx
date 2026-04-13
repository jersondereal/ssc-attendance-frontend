import { Phone } from "lucide-react";
import { useLocation } from "react-router-dom";

const footerItems = [
  {
    id: "email",
    label: "essuguiuansc@gmail.com",
    href: "mailto:essuguiuansc@gmail.com",
    icon: "/gmail.svg",
  },
  {
    id: "facebook",
    label: "Supreme Student Council- ESSU Guiuan",
    href: "https://www.facebook.com/share/14h86jqKtSS/?mibextid=wwXIfr",
    icon: "/facebook.svg",
  },
  {
    id: "phone",
    label: "+63 909 919 9236",
    href: "tel:+639099199236",
    icon: "phone" as const,
  },
];

export function FooterSection() {
  const { pathname } = useLocation();
  const maxWidthClass =
    pathname === "/register" ? "max-w-[50rem]" : "max-w-[70rem]";
  return (
    <div className="border-t border-border-dark w-full pt-7 pb-10 md:pt-5 md:pb-5 text-xs">
      <div
        className={`flex flex-row items-center ${maxWidthClass} mx-auto px-5`}
      >
        <div className="pr-4 mr-4 border-r border-border-dark">
          <img src="/logo.png" alt="SSC Logo" className="size-10 md:size-8" />
        </div>
        <p className="text-wrap hidden md:block font-medium text-center leading-tight tracking-tighter">
          OFFICE OF THE SUPREME <br /> STUDENT COUNCIL
        </p>
        <div className="flex flex-col gap-2 md:ml-auto">
          {footerItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              target={item.id === "facebook" ? "_blank" : undefined}
              rel={item.id === "facebook" ? "noopener noreferrer" : undefined}
              className="flex flex-row items-center gap-3 text-nowrap hover:underline"
            >
              {item.icon === "phone" ? (
                <Phone className="size-4 shrink-0" />
              ) : (
                <img src={item.icon} alt={item.label} className="size-4" />
              )}
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
