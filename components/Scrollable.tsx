/**
 * Scrollable DIV Component.
 *
 * Spending hours and hours searching for how to make flex overflow-y-scroll...
 */
const Scrollable = ({
  children,
  content,
}: {
  children: React.ReactNode | React.ReactNode[];
  content?: boolean;
}) => {
  return (
    <div
      className={`flex-1 w-full flex ${
        content ? "lg:min-h-0 lg:h-[calc(100vh_-_72px)]" : ""
      }`}
    >
      <div
        className={`flex-1 w-full ${content ? "lg:overflow-auto lg:p-6" : ""}`}
      >
        {children}
      </div>
    </div>
  );
};

export default Scrollable;
