export function SettingsUnavailable() {
  return (
    <div className="w-full max-w-[70rem] mx-auto flex items-center justify-center h-64 px-10">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-600 mb-2">
          Settings Unavailable
        </h2>
        <p className="text-gray-500 text-sm">
          Settings are not available for your account. If you need access to
          settings, please contact your administrator.
        </p>
      </div>
    </div>
  );
}
