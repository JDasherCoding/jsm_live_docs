"use client";
import { ClientSideSuspense, RoomProvider } from "@liveblocks/react/suspense";
import Loader from "./Loader";
import Header from "./Header";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Editor } from "./editor/Editor";
import ActiveCollaborators from "./ActiveCollaborators";
import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import Image from "next/image";
import { updateDocument } from "@/lib/actions/room.actions";

const CollaborativeRoom = ({
	roomId,
	roomMetadata,
}: CollaborativeRoomProps) => {
	const currentUserType = "editor";

	const updateTitleHandler = async (
		e: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (e.key === "Enter") {
			setLoading(true);

			try {
				if (documentTitle !== roomMetadata.title) {
					const updatedDocument = await updateDocument(roomId, documentTitle);

					if (updatedDocument) {
						setEditing(false);
					}
				}
			} catch (error) {
				console.log(`Error while changing title: ${error}`);
			}

			setLoading(false);
		}
	};
	const [documentTitle, setDocumentTitle] = useState(roomMetadata.title);
	const [editing, setEditing] = useState(false);
	const [loading, setLoading] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setEditing(false);
				updateDocument(roomId, documentTitle);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [roomId, documentTitle]);

	// Reload on title change
	useEffect(() => {
		if (editing && inputRef.current) {
			inputRef.current.focus();
		}
	}, [editing]);
	return (
		<RoomProvider id={roomId}>
			<ClientSideSuspense fallback={<Loader />}>
				<div className="collaborative-room">
					<Header>
						<div
							ref={containerRef}
							className="flex w-fit items-center justify-center gap-2"
						>
							{editing && !loading ? (
								<Input
									type="text"
									value={documentTitle}
									ref={inputRef}
									placeholder="Enter title"
									onChange={(e) => setDocumentTitle(e.target.value)}
									onKeyDown={updateTitleHandler}
									disabled={!editing}
									className="document-title-input"
								/>
							) : (
								<>
									<p className="document-title">{documentTitle}</p>
								</>
							)}

							{currentUserType === "editor" && !editing && (
								<Image
									src="/assets/icons/edit.svg"
									height={24}
									width={24}
									alt="Edit"
									onClick={() => setEditing(true)}
									className="pointer"
								/>
							)}

							{currentUserType !== "editor" && !editing && (
								<p className="view-only-tag">View Only</p>
							)}

							{loading && <p className="text-sm text-gray-400">saving...</p>}
						</div>
						{/* Collaborators */}
						<div className="flex w-full flex-1 justify-end gap-2 sm:gap-3">
							<ActiveCollaborators />
							<SignedOut>
								<SignInButton />
							</SignedOut>
							<SignedIn>
								<UserButton />
							</SignedIn>
						</div>
					</Header>
					<Editor />
				</div>
			</ClientSideSuspense>
		</RoomProvider>
	);
};

export default CollaborativeRoom;